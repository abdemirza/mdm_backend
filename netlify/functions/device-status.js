// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

const { google } = require('googleapis');

// In-memory database for custom devices (same as custom-devices.js)
class DeviceDatabase {
  constructor() {
    this.devices = new Map();
    this.nextId = 1;
  }

  async getDevice(imei) {
    return this.devices.get(imei) || null;
  }

  async getAllDevices() {
    return Array.from(this.devices.values());
  }
}

// Singleton instance
const deviceDatabase = new DeviceDatabase();

// Android Management Service
class AndroidManagementService {
  constructor() {
    this.service = null;
    this.enterpriseName = process.env.ENTERPRISE_ID;
  }

  async initialize() {
    try {
      if (this.service) return;

      logger.info('Initializing Android Management service...');
      
      // Check for service account key
      let credentials;
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        logger.info('Using service account key from environment variable');
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      } else {
        logger.info('Using service account key from file');
        const fs = require('fs');
        const keyPath = './mdm_server_key.json';
        if (fs.existsSync(keyPath)) {
          credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        } else {
          throw new Error('No service account credentials found');
        }
      }

      // Initialize the Android Management API
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidmanagement'],
      });

      this.service = google.androidmanagement({ version: 'v1', auth });
      
      if (!this.enterpriseName) {
        throw new Error('ENTERPRISE_ID environment variable not set');
      }
      
      logger.info(`Android Management service initialized for enterprise: ${this.enterpriseName}`);
    } catch (error) {
      logger.error('Failed to initialize Android Management service:', error);
      throw error;
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
      const customDevice = await deviceDatabase.getDevice(imei);
      
      if (customDevice) {
        const status = {
          imei: imei,
          source: 'custom_database',
          deviceName: customDevice.deviceName || 'Unknown',
          model: customDevice.model || 'Unknown',
          manufacturer: customDevice.manufacturer || 'Unknown',
          osVersion: customDevice.osVersion || 'Unknown',
          isLocked: customDevice.isLocked || false,
          status: customDevice.status || 'unknown',
          registeredAt: customDevice.registeredAt || 'Unknown',
          lastSeen: customDevice.lastSeen || 'Never',
          lastLockTime: customDevice.lastLockTime || null,
          lastUnlockTime: customDevice.lastUnlockTime || null,
          serialNumber: customDevice.serialNumber || null,
          deviceId: customDevice.deviceId || null,
          androidId: customDevice.androidId || null,
          macAddress: customDevice.macAddress || null,
          customData: customDevice.customData || {}
        };
        
        return {
          success: true,
          data: status,
          message: 'Device status retrieved from custom database',
        };
      }
      
      // Device not found in either source
      return {
        success: false,
        error: 'Device not found',
        data: {
          imei: imei,
          source: 'not_found',
          message: 'Device not found in Android Enterprise or custom database. Please verify the IMEI number.'
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
}

const androidService = new AndroidManagementService();

// Initialize service
async function initializeService() {
  try {
    await androidService.initialize();
  } catch (error) {
    logger.error('Failed to initialize service:', error);
    throw error;
  }
}

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const { httpMethod, path, queryStringParameters } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'device-status' from path segments
    const devicePath = pathSegments.slice(2).join('/');

    if (httpMethod === 'GET') {
      if (devicePath.startsWith('imei/')) {
        // GET /api/device-status/imei/{imei} - Get device status by IMEI
        const imei = devicePath.replace('imei/', '');
        
        // Validate IMEI format
        if (!/^\d{15}$/.test(imei)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Invalid IMEI format. IMEI must be 15 digits.',
            }),
          };
        }
        
        const result = await androidService.getDeviceStatusByImei(imei);
        return {
          statusCode: result.success ? 200 : 404,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Endpoint not found. Use /api/device-status/imei/{imei}',
          }),
        };
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use GET method.',
        }),
      };
    }
  } catch (error) {
    logger.error('Error in device-status function:', error);
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
