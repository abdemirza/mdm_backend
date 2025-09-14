import { google } from 'googleapis';
import fs from 'fs';

// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Android Management Service for Netlify Functions
class AndroidManagementService {
  constructor() {
    this.service = null;
    this.enterpriseName = `enterprises/${process.env.ENTERPRISE_ID || 'LC048psd8h'}`;
  }

  async initialize() {
    try {
      logger.info('Starting authentication process...');
      logger.info('Environment variables:', {
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET',
        ENTERPRISE_ID: process.env.ENTERPRISE_ID || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET'
      });

      // Check if we have the service account key as environment variable
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        logger.info('Using service account key from environment variable');
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
          const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/androidmanagement'],
          });

          const client = await auth.getClient();
          this.service = google.androidmanagement({
            version: 'v1',
            auth: client,
          });

          logger.info('Successfully authenticated with Android Management API using environment credentials');
          return true;
        } catch (parseError) {
          logger.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError);
          return false;
        }
      }

      // Fallback to file-based authentication
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './mdm_server_key.json';
      logger.info(`Checking for service account file at: ${credentialsPath}`);
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error(`Service account file not found at ${credentialsPath}`);
        logger.info('Available files in current directory:', fs.readdirSync('.'));
        return false;
      }

      logger.info('Service account file found, proceeding with file-based auth');
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/androidmanagement'],
      });

      const client = await auth.getClient();
      this.service = google.androidmanagement({
        version: 'v1',
        auth: client,
      });

      logger.info('Successfully authenticated with Android Management API using file');
      return true;
    } catch (error) {
      logger.error('Authentication failed:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return false;
    }
  }

  async listDevices() {
    try {
      logger.info(`Listing devices for enterprise: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.devices.list({
        parent: this.enterpriseName,
      });

      const devices = response.data.devices || [];
      
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

  async getDevice(deviceName) {
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

  async issueCommand(deviceName, command) {
    try {
      logger.info(`Issuing command ${command.type} to device: ${deviceName}`);
      
      const response = await this.service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: command,
      });

      const operation = {
        name: response.data.name,
        done: false,
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

  async lockDevice(deviceName, duration = '120s') {
    const command = {
      type: 'LOCK',
      duration,
    };
    
    return this.issueCommand(deviceName, command);
  }

  async unlockDevice(deviceName) {
    logger.info(`Unlocking device: ${deviceName} (using REBOOT command)`);
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  async resetPassword(deviceName) {
    return this.issueCommand(deviceName, {
      type: 'RESET_PASSWORD',
    });
  }

  async enableLostMode(deviceName, message, phoneNumber, email, streetAddress, organizationName) {
    logger.info(`Enabling lost mode on device: ${deviceName} with message: ${message}`);
    
    const startLostModeParams = {};
    
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
    
    const command = {
      type: 'START_LOST_MODE',
      startLostModeParams,
    };
    
    return this.issueCommand(deviceName, command);
  }

  async disableLostMode(deviceName) {
    logger.info(`Disabling lost mode on device: ${deviceName}`);
    return this.issueCommand(deviceName, {
      type: 'STOP_LOST_MODE',
    });
  }

  async rebootDevice(deviceName) {
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  async wipeDevice(deviceName, reason) {
    return this.issueCommand(deviceName, {
      type: 'REBOOT',
    });
  }

  async getOperationStatus(operationName) {
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

  async getEnterprise() {
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

  async getDeviceStatusByImei(imei) {
    try {
      logger.info(`Getting device status by IMEI: ${imei}`);
      
      // First, try to find the device in Android Enterprise by IMEI
      const devices = await this.listDevices();
      
      if (devices.success && devices.data) {
        const device = devices.data.find(d => 
          d.hardwareInfo && 
          d.hardwareInfo.serialNumber === imei
        );
        
        if (device) {
          // Device found in Android Enterprise
          const status = {
            imei: imei,
            source: 'android_enterprise',
            deviceName: device.name,
            model: device.hardwareInfo?.model || 'Unknown',
            manufacturer: device.hardwareInfo?.manufacturer || 'Unknown',
            osVersion: device.softwareInfo?.androidVersion || 'Unknown',
            policyName: device.policyName || 'No policy assigned',
            state: device.state || 'UNKNOWN',
            managementMode: device.managementMode || 'UNKNOWN',
            appliedState: device.appliedState || 'UNKNOWN',
            enrollmentTokenName: device.enrollmentTokenName || 'No enrollment token',
            lastStatusReportTime: device.lastStatusReportTime || 'Never',
            lastPolicySyncTime: device.lastPolicySyncTime || 'Never',
            userName: device.userName || 'No user',
            hardwareInfo: device.hardwareInfo || {},
            softwareInfo: device.softwareInfo || {},
            policyCompliant: device.policyCompliant || false,
            deviceSettings: device.deviceSettings || {},
            networkInfo: device.networkInfo || {},
            memoryInfo: device.memoryInfo || {},
            powerManagementEvents: device.powerManagementEvents || [],
            appliedPolicyName: device.appliedPolicyName || 'No applied policy',
            appliedPolicyVersion: device.appliedPolicyVersion || '0',
            appliedState: device.appliedState || 'UNKNOWN',
            disabledReason: device.disabledReason || null,
            enrollmentTime: device.enrollmentTime || 'Not enrolled',
            lastPolicyComplianceReportTime: device.lastPolicyComplianceReportTime || 'Never',
            lastStatusReportTime: device.lastStatusReportTime || 'Never',
            memoryEvents: device.memoryEvents || [],
            networkEvents: device.networkEvents || [],
            powerManagementEvents: device.powerManagementEvents || [],
            systemProperties: device.systemProperties || {},
            userOwners: device.userOwners || [],
            nonComplianceDetails: device.nonComplianceDetails || []
          };
          
          return {
            success: true,
            data: status,
            message: 'Device status retrieved from Android Enterprise',
          };
        }
      }
      
      // If not found in Android Enterprise, check custom device database
      // Note: This would require importing the custom device service
      // For now, return not found
      return {
        success: false,
        error: 'Device not found in Android Enterprise',
        data: {
          imei: imei,
          source: 'not_found',
          message: 'Device not found in Android Enterprise. Check custom device database or verify IMEI.'
        }
      };
      
    } catch (error) {
      logger.error('Error getting device status by IMEI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async listPolicies() {
    try {
      logger.info(`Listing policies for enterprise: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.policies.list({
        parent: this.enterpriseName,
      });

      const policies = response.data.policies || [];
      
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

  async createPolicy(policyData) {
    try {
      logger.info(`Creating policy for enterprise: ${this.enterpriseName}`);
      
      // Generate a unique policy name
      const policyId = policyData.policyId || `policy_${Date.now()}`;
      const policyName = `${this.enterpriseName}/policies/${policyId}`;
      
      // Prepare the policy resource
      const policyResource = {
        name: policyName,
        displayName: policyData.displayName || `Policy ${policyId}`,
        description: policyData.description || 'Custom policy created via API',
        ...policyData.settings
      };

      // Use patch method to create/update policy
      const response = await this.service.enterprises.policies.patch({
        name: policyName,
        resource: policyResource,
      });
      
      logger.info(`Policy created successfully: ${policyName}`);
      return {
        success: true,
        data: response.data,
        message: 'Policy created successfully',
      };
    } catch (error) {
      logger.error('Error creating policy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

const androidService = new AndroidManagementService();

// Initialize service
let serviceInitialized = false;
const initializeService = async () => {
  if (!serviceInitialized) {
    serviceInitialized = await androidService.initialize();
    if (!serviceInitialized) {
      throw new Error('Failed to initialize Android Management service');
    }
  }
};

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    await initializeService();

    const { httpMethod, path, body, queryStringParameters } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'devices' from path segments
    const devicePath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'GET':
        if (devicePath === '') {
          // GET /api/devices - List all devices
          const result = await androidService.listDevices();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.startsWith('operations/')) {
          // GET /api/devices/operations/:operationName
          const operationName = devicePath.replace('operations/', '');
          const result = await androidService.getOperationStatus(operationName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath === 'policies') {
          // GET /api/devices/policies - List all policies
          const result = await androidService.listPolicies();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath === 'enterprise') {
          // GET /api/devices/enterprise - Get enterprise details
          const result = await androidService.getEnterprise();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.startsWith('status/imei/')) {
          // GET /api/devices/status/imei/{imei} - Get device status by IMEI
          const imei = devicePath.replace('status/imei/', '');
          const result = await androidService.getDeviceStatusByImei(imei);
          return {
            statusCode: result.success ? 200 : 404,
            headers,
            body: JSON.stringify(result),
          };
        } else {
          // GET /api/devices/:deviceName - Get device details
          const result = await androidService.getDevice(devicePath);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        }

      case 'POST':
        const requestBody = body ? JSON.parse(body) : {};
        
        if (devicePath.endsWith('/lock')) {
          // POST /api/devices/:deviceName/lock
          const deviceName = devicePath.replace('/lock', '');
          const duration = requestBody.duration || '120s';
          const result = await androidService.lockDevice(deviceName, duration);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/unlock')) {
          // POST /api/devices/:deviceName/unlock
          const deviceName = devicePath.replace('/unlock', '');
          const result = await androidService.unlockDevice(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/lost-mode')) {
          // POST /api/devices/:deviceName/lost-mode
          const deviceName = devicePath.replace('/lost-mode', '');
          const { lostMessage, phoneNumber, emailAddress, streetAddress, organizationName } = requestBody;
          const result = await androidService.enableLostMode(
            deviceName, 
            lostMessage, 
            phoneNumber, 
            emailAddress, 
            streetAddress, 
            organizationName
          );
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/exit-lost-mode')) {
          // POST /api/devices/:deviceName/exit-lost-mode
          const deviceName = devicePath.replace('/exit-lost-mode', '');
          const result = await androidService.disableLostMode(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/reset-password')) {
          // POST /api/devices/:deviceName/reset-password
          const deviceName = devicePath.replace('/reset-password', '');
          const result = await androidService.resetPassword(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/reboot')) {
          // POST /api/devices/:deviceName/reboot
          const deviceName = devicePath.replace('/reboot', '');
          const result = await androidService.rebootDevice(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/wipe')) {
          // POST /api/devices/:deviceName/wipe
          const deviceName = devicePath.replace('/wipe', '');
          const reason = requestBody.reason;
          const result = await androidService.wipeDevice(deviceName, reason);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/commands')) {
          // POST /api/devices/:deviceName/commands
          const deviceName = devicePath.replace('/commands', '');
          const result = await androidService.issueCommand(deviceName, requestBody);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath === 'policies') {
          // POST /api/devices/policies - Create a new policy
          const result = await androidService.createPolicy(requestBody);
          return {
            statusCode: result.success ? 201 : 400,
            headers,
            body: JSON.stringify(result),
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Endpoint not found',
            }),
          };
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed',
          }),
        };
    }
  } catch (error) {
    logger.error('Error in devices function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
    };
  }
};