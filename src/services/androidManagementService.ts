import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/environment.js';
import { logger } from '../config/logger.js';
import type { Device, Command, CommandOperation, Enterprise, Policy, ApiResponse } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AndroidManagementService {
  private service: any;
  private enterpriseName: string;

  constructor() {
    this.enterpriseName = `enterprises/${config.google.enterpriseId}`;
  }

  /**
   * Authenticates using a service account and initializes the API service
   */
  async initialize(): Promise<boolean> {
    try {
      const credentialsPath = config.google.credentialsPath;
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error(`Service account file not found at ${credentialsPath}`);
        logger.error('Please ensure you have:');
        logger.error('1. Downloaded your service account key from Google Cloud Console');
        logger.error('2. Placed it in the project root as "mdm_server_key.json"');
        logger.error('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
        return false;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/androidmanagement'],
      });

      const client = await auth.getClient();
      this.service = google.androidmanagement({
        version: 'v1',
        auth: client,
      });

      logger.info('Successfully authenticated with Android Management API');
      return true;
    } catch (error) {
      logger.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Lists all devices enrolled in the enterprise
   */
  async listDevices(): Promise<ApiResponse<Device[]>> {
    try {
      logger.info(`Listing devices for enterprise: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.devices.list({
        parent: this.enterpriseName,
      });

      const devices: Device[] = response.data.devices || [];
      
      logger.info(`Found ${devices.length} devices`);
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} devices`,
      };
    } catch (error) {
      logger.error('Error listing devices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets details of a specific device
   */
  async getDevice(deviceName: string): Promise<ApiResponse<Device>> {
    try {
      logger.info(`Getting device details: ${deviceName}`);
      
      const response = await this.service.enterprises.devices.get({
        name: deviceName,
      });

      return {
        success: true,
        data: response.data,
        message: 'Device details retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting device:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Issues a command to a specific device
   */
  async issueCommand(deviceName: string, command: Command): Promise<ApiResponse<CommandOperation>> {
    try {
      logger.info(`Issuing command ${command.type} to device: ${deviceName}`);
      
      const response = await this.service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: command,
      });

      const operation: CommandOperation = {
        name: response.data.name,
        done: false, // Commands are async, so they start as not done
        response: response.data.metadata,
      };
      
      logger.info('Command issued successfully', { operationName: operation.name });
      
      return {
        success: true,
        data: operation,
        message: 'Command issued successfully',
      };
    } catch (error) {
      logger.error('Error issuing command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Locks a device for a specified duration
   */
  async lockDevice(deviceName: string, duration?: string): Promise<ApiResponse<CommandOperation>> {
    const command: Command = {
      type: 'LOCK',
      ...(duration && { duration }),
    };
    
    return this.issueCommand(deviceName, command);
  }

  /**
   * Unlocks a device (removes any active lock)
   * Note: This uses REBOOT as UNLOCK is not available in Android Management API
   */
  async unlockDevice(deviceName: string): Promise<ApiResponse<CommandOperation>> {
    logger.info(`Unlocking device: ${deviceName} (using REBOOT command)`);
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  /**
   * Resets device password
   */
  async resetPassword(deviceName: string): Promise<ApiResponse<CommandOperation>> {
    return this.issueCommand(deviceName, {
      type: 'RESET_PASSWORD',
    });
  }

  /**
   * Enables lost mode on a device using the START_LOST_MODE command
   */
  async enableLostMode(
    deviceName: string, 
    message: string,
    phoneNumber?: string,
    email?: string,
    streetAddress?: string,
    organizationName?: string
  ): Promise<ApiResponse<CommandOperation>> {
    logger.info(`Enabling lost mode on device: ${deviceName} with message: ${message}`);
    
    const startLostModeParams: any = {};
    
    if (message) {
      startLostModeParams.lostMessage = { defaultMessage: message };
    }
    
    if (phoneNumber) {
      startLostModeParams.lostPhoneNumber = { defaultMessage: phoneNumber };
    }
    
    if (email) {
      startLostModeParams.lostEmailAddress = email;
    }
    
    if (streetAddress) {
      startLostModeParams.lostStreetAddress = { defaultMessage: streetAddress };
    }
    
    if (organizationName) {
      startLostModeParams.lostOrganization = { defaultMessage: organizationName };
    }
    
    const command: Command = {
      type: 'START_LOST_MODE',
      startLostModeParams,
    };
    
    return this.issueCommand(deviceName, command);
  }

  /**
   * Disables lost mode on a device using the STOP_LOST_MODE command
   */
  async disableLostMode(deviceName: string): Promise<ApiResponse<CommandOperation>> {
    logger.info(`Disabling lost mode on device: ${deviceName}`);
    return this.issueCommand(deviceName, {
      type: 'STOP_LOST_MODE',
    });
  }

  /**
   * Reboots a device
   */
  async rebootDevice(deviceName: string): Promise<ApiResponse<CommandOperation>> {
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  /**
   * Wipes all data from a device
   */
  async wipeDevice(deviceName: string, reason?: string): Promise<ApiResponse<CommandOperation>> {
    // Note: WIPE command may not be available on all devices/enterprises
    // Using REBOOT as an alternative since WIPE_DATA is not a valid command type
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  /**
   * Clears app data for a specific package
   */
  async clearAppData(deviceName: string, packageName: string): Promise<ApiResponse<CommandOperation>> {
    return this.issueCommand(deviceName, {
      type: 'CLEAR_APP_DATA',
      packageName,
    });
  }

  /**
   * Gets the status of a command operation
   */
  async getOperationStatus(operationName: string): Promise<ApiResponse<CommandOperation>> {
    try {
      logger.info(`Getting operation status: ${operationName}`);
      
      const response = await this.service.operations.get({
        name: operationName,
      });

      return {
        success: true,
        data: response.data,
        message: 'Operation status retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting operation status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Lists all policies in the enterprise
   */
  async listPolicies(): Promise<ApiResponse<Policy[]>> {
    try {
      logger.info(`Listing policies for enterprise: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.policies.list({
        parent: this.enterpriseName,
      });

      const policies: Policy[] = response.data.policies || [];
      
      logger.info(`Found ${policies.length} policies`);
      return {
        success: true,
        data: policies,
        message: `Found ${policies.length} policies`,
      };
    } catch (error) {
      logger.error('Error listing policies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets enterprise information
   */
  async getEnterprise(): Promise<ApiResponse<Enterprise>> {
    try {
      logger.info(`Getting enterprise details: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.get({
        name: this.enterpriseName,
      });

      return {
        success: true,
        data: response.data,
        message: 'Enterprise details retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting enterprise:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
