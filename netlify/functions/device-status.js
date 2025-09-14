// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

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

// Simple device status service that works without external dependencies
class DeviceStatusService {
  constructor() {
    this.enterpriseName = process.env.ENTERPRISE_ID;
  }

  async getDeviceStatusByImei(imei) {
    try {
      logger.info(`Getting device status by IMEI: ${imei}`);
      
      // For now, only check custom device database
      // Android Enterprise integration would require the googleapis module
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
      
      // Device not found in custom database
      return {
        success: false,
        error: 'Device not found',
        data: {
          imei: imei,
          source: 'not_found',
          message: 'Device not found in custom database. Please verify the IMEI number or register the device first.'
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

const deviceStatusService = new DeviceStatusService();

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
        
        const result = await deviceStatusService.getDeviceStatusByImei(imei);
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
