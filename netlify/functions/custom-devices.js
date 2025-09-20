// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Import MongoDB service
const mongoDBService = require('./mongodb-service');

// MongoDB-based database service
class DeviceDatabase {
  constructor() {
    this.mongoDB = mongoDBService;
  }

  async registerDevice(deviceData) {
    try {
      const device = await this.mongoDB.registerDevice(deviceData);
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    try {
      const device = await this.mongoDB.getDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(identifier, updates) {
    try {
      const device = await this.mongoDB.updateDeviceStatus(identifier, updates);
      return device;
    } catch (error) {
      logger.error('Error updating device status:', error);
      throw error;
    }
  }

  async lockDevice(identifier) {
    try {
      const device = await this.mongoDB.lockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error locking device:', error);
      throw error;
    }
  }

  async unlockDevice(identifier) {
    try {
      const device = await this.mongoDB.unlockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const devices = await this.mongoDB.getAllDevices();
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      const devices = await this.mongoDB.getDevicesByStatus(status);
      return devices;
    } catch (error) {
      logger.error('Error getting devices by status:', error);
      throw error;
    }
  }
}

// Singleton instance
const deviceDatabase = new DeviceDatabase();

// Device Database Service
class DeviceDatabaseService {
  static async registerDevice(deviceData) {
    try {
      // Check if device already exists
      const existingDevice = await deviceDatabase.getDevice(deviceData.imei);
      if (existingDevice) {
        return {
          success: false,
          error: 'Device with this IMEI already exists',
          data: existingDevice,
        };
      }

      const device = await deviceDatabase.registerDevice(deviceData);
      
      return {
        success: true,
        data: device,
        message: 'Device registered successfully',
      };
    } catch (error) {
      logger.error('Error in registerDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getDevice(imei) {
    try {
      const device = await deviceDatabase.getDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device found',
      };
    } catch (error) {
      logger.error('Error in getDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async lockDevice(imei) {
    try {
      const device = await deviceDatabase.lockDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device locked successfully',
      };
    } catch (error) {
      logger.error('Error in lockDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async unlockDevice(imei) {
    try {
      const device = await deviceDatabase.unlockDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device unlocked successfully',
      };
    } catch (error) {
      logger.error('Error in unlockDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getAllDevices() {
    try {
      const devices = await deviceDatabase.getAllDevices();
      
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} devices`,
      };
    } catch (error) {
      logger.error('Error in getAllDevices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getDevicesByStatus(status) {
    try {
      const devices = await deviceDatabase.getDevicesByStatus(status);
      
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} devices with status: ${status}`,
      };
    } catch (error) {
      logger.error('Error in getDevicesByStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async updateDeviceStatus(imei, updates) {
    try {
      const device = await deviceDatabase.updateDeviceStatus(imei, updates);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device status updated successfully',
      };
    } catch (error) {
      logger.error('Error in updateDeviceStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

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
    const { httpMethod, path, body, queryStringParameters } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'custom-devices' from path segments
    const devicePath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'POST':
        const requestBody = body ? JSON.parse(body) : {};
        
        if (devicePath === 'register') {
          // POST /api/custom-devices/register - Register a new device
          return await handleDeviceRegistration(requestBody, headers);
        } else if (devicePath === 'lock') {
          // POST /api/custom-devices/lock - Lock a device
          return await handleDeviceLock(requestBody, headers);
        } else if (devicePath === 'unlock') {
          // POST /api/custom-devices/unlock - Unlock a device
          return await handleDeviceUnlock(requestBody, headers);
        } else if (devicePath === 'update-status') {
          // POST /api/custom-devices/update-status - Update device status
          return await handleDeviceStatusUpdate(requestBody, headers);
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

      case 'PUT':
        const putRequestBody = body ? JSON.parse(body) : {};
        
        if (devicePath === '') {
          // PUT /api/custom-devices - Update device (including FCM token)
          return await handleDeviceUpdate(putRequestBody, headers);
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'PUT endpoint not found',
            }),
          };
        }

      case 'GET':
        if (devicePath === '') {
          // GET /api/custom-devices - List all devices
          const result = await DeviceDatabaseService.getAllDevices();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.startsWith('status/')) {
          // GET /api/custom-devices/status/{status} - Get devices by status
          const status = devicePath.replace('status/', '');
          const result = await DeviceDatabaseService.getDevicesByStatus(status);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.startsWith('device/')) {
          // GET /api/custom-devices/device/{imei} - Get specific device
          const imei = devicePath.replace('device/', '');
          const result = await DeviceDatabaseService.getDevice(imei);
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
    logger.error('Error in custom-devices function:', error);
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

async function handleDeviceRegistration(requestBody, headers) {
  try {
    // Validate required fields
    const { imei, androidId } = requestBody;
    
    if (!imei && !androidId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either IMEI or androidId is required',
        }),
      };
    }

    // Validate IMEI format if provided (basic validation)
    if (imei && !/^\d{15}$/.test(imei)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'IMEI must be 15 digits',
        }),
      };
    }

    // Validate androidId format if provided (basic validation)
    if (androidId && !/^[a-f0-9]{16}$/.test(androidId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'androidId must be 16 hexadecimal characters',
        }),
      };
    }

    const result = await DeviceDatabaseService.registerDevice(requestBody);
    
    return {
      statusCode: result.success ? 201 : 400,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleDeviceRegistration:', error);
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
}

async function handleDeviceLock(requestBody, headers) {
  try {
    const { imei, androidId } = requestBody;
    
    if (!imei && !androidId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either IMEI or androidId is required',
        }),
      };
    }

    const identifier = imei || androidId;
    const result = await DeviceDatabaseService.lockDevice(identifier);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleDeviceLock:', error);
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
}

async function handleDeviceUnlock(requestBody, headers) {
  try {
    const { imei, androidId } = requestBody;
    
    if (!imei && !androidId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either IMEI or androidId is required',
        }),
      };
    }

    const identifier = imei || androidId;
    const result = await DeviceDatabaseService.unlockDevice(identifier);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleDeviceUnlock:', error);
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
}

async function handleDeviceStatusUpdate(requestBody, headers) {
  try {
    const { imei, androidId, ...updates } = requestBody;
    
    if (!imei && !androidId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either IMEI or androidId is required',
        }),
      };
    }

    const identifier = imei || androidId;
    const result = await DeviceDatabaseService.updateDeviceStatus(identifier, updates);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleDeviceStatusUpdate:', error);
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
}

async function handleDeviceUpdate(requestBody, headers) {
  try {
    const { imei, androidId, fcmToken, lastSeen, isLocked, status, lastLockTime, lastUnlockTime } = requestBody;
    
    if (!imei && !androidId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either IMEI or androidId is required',
        }),
      };
    }

    const identifier = imei || androidId;
    const updates = {};
    
    if (fcmToken) {
      updates.fcmToken = fcmToken;
    }
    
    if (lastSeen) {
      updates.lastSeen = lastSeen;
    }

    if (typeof isLocked !== 'undefined') {
      updates.isLocked = isLocked;
    }

    if (status) {
      updates.status = status;
    }

    if (lastLockTime) {
      updates.lastLockTime = lastLockTime;
    }

    if (lastUnlockTime) {
      updates.lastUnlockTime = lastUnlockTime;
    }

    const result = await DeviceDatabaseService.updateDeviceStatus(identifier, updates);
    
    return {
      statusCode: result ? 200 : 404,
      headers,
      body: JSON.stringify({
        success: !!result,
        data: result,
        message: result ? 'Device status updated successfully' : 'Device not found'
      }),
    };
  } catch (error) {
    logger.error('Error in handleDeviceUpdate:', error);
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
}