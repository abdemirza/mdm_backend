// Fallback Custom Devices API for Netlify Functions (In-memory with better error handling)
const https = require('https');

const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Simple in-memory database for demo (will be replaced with Firestore when working)
class DeviceDatabase {
  constructor() {
    this.devices = new Map();
    this.nextId = 1;
  }

  async registerDevice(deviceData) {
    try {
      const device = {
        id: this.nextId++,
        ...deviceData,
        isLocked: false,
        registeredAt: new Date().toISOString(),
        status: 'active',
        lastSeen: new Date().toISOString(),
      };

      // Store device by both IMEI and androidId for flexible lookup
      this.devices.set(device.imei, device);
      if (device.androidId) {
        this.devices.set(device.androidId, device);
      }
      
      logger.info(`Device registered: IMEI ${device.imei}, AndroidId ${device.androidId}`, { deviceId: device.id });
      
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    // Try to get device by identifier (could be IMEI or androidId)
    return this.devices.get(identifier) || null;
  }

  async updateDeviceStatus(identifier, updates) {
    const device = this.devices.get(identifier);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      ...updates,
      lastSeen: new Date().toISOString(),
    };

    // Update both IMEI and androidId entries
    this.devices.set(device.imei, updatedDevice);
    if (device.androidId) {
      this.devices.set(device.androidId, updatedDevice);
    }
    
    logger.info(`Device updated: IMEI ${device.imei}, AndroidId ${device.androidId}`, { updates });
    
    return updatedDevice;
  }

  async lockDevice(identifier) {
    const device = this.devices.get(identifier);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      isLocked: true,
      lastLockTime: new Date().toISOString(),
      status: 'locked',
      lastSeen: new Date().toISOString(),
    };

    // Update both IMEI and androidId entries
    this.devices.set(device.imei, updatedDevice);
    if (device.androidId) {
      this.devices.set(device.androidId, updatedDevice);
    }
    
    logger.info(`Device locked: IMEI ${device.imei}, AndroidId ${device.androidId}`);
    
    return updatedDevice;
  }

  async unlockDevice(identifier) {
    const device = this.devices.get(identifier);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      isLocked: false,
      lastUnlockTime: new Date().toISOString(),
      status: 'active',
      lastSeen: new Date().toISOString(),
    };

    // Update both IMEI and androidId entries
    this.devices.set(device.imei, updatedDevice);
    if (device.androidId) {
      this.devices.set(device.androidId, updatedDevice);
    }
    
    logger.info(`Device unlocked: IMEI ${device.imei}, AndroidId ${device.androidId}`);
    
    return updatedDevice;
  }

  async getAllDevices() {
    // Get unique devices by filtering out duplicates (since we store by both IMEI and androidId)
    const devices = Array.from(this.devices.values());
    const uniqueDevices = devices.filter((device, index, self) => 
      index === self.findIndex(d => d.id === device.id)
    );
    return uniqueDevices;
  }

  async getDevicesByStatus(status) {
    const devices = await this.getAllDevices();
    return devices.filter(device => device.status === status);
  }
}

// Create singleton instance
const DeviceDatabaseService = new DeviceDatabase();

// Helper functions
async function handleDeviceRegistration(requestBody, headers) {
  try {
    // Validate required fields
    const { imei, androidId, deviceName, model, manufacturer } = requestBody;
    
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

    if (!deviceName || !model || !manufacturer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'deviceName, model, and manufacturer are required',
        }),
      };
    }

    const device = await DeviceDatabaseService.registerDevice(requestBody);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: device,
        message: 'Device registered successfully (in-memory storage)',
      }),
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
    const device = await DeviceDatabaseService.lockDevice(identifier);
    
    if (!device) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Device not found',
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: device,
        message: 'Device locked successfully',
      }),
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
    const device = await DeviceDatabaseService.unlockDevice(identifier);
    
    if (!device) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Device not found',
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: device,
        message: 'Device unlocked successfully',
      }),
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

    const device = await DeviceDatabaseService.updateDeviceStatus(identifier, updates);
    
    return {
      statusCode: device ? 200 : 404,
      headers,
      body: JSON.stringify({
        success: !!device,
        data: device,
        message: device ? 'Device status updated successfully' : 'Device not found'
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
          const devices = await DeviceDatabaseService.getAllDevices();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: devices,
              message: `Found ${devices.length} devices (in-memory storage)`
            }),
          };
        } else if (devicePath.startsWith('status/')) {
          // GET /api/custom-devices/status/{status} - Get devices by status
          const status = devicePath.replace('status/', '');
          const devices = await DeviceDatabaseService.getDevicesByStatus(status);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: devices,
              message: `Found ${devices.length} devices with status: ${status} (in-memory storage)`
            }),
          };
        } else if (devicePath.startsWith('device/')) {
          // GET /api/custom-devices/device/{imei} - Get specific device
          const imei = devicePath.replace('device/', '');
          const device = await DeviceDatabaseService.getDevice(imei);
          return {
            statusCode: device ? 200 : 404,
            headers,
            body: JSON.stringify({
              success: !!device,
              data: device,
              message: device ? 'Device found (in-memory storage)' : 'Device not found'
            }),
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
