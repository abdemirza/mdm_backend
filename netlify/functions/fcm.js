// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// FCM Service for sending push notifications to devices
class FCMService {
  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY;
    this.fcmUrl = 'https://fcm.googleapis.com/fcm/send';
  }

  async sendNotificationToDevice(fcmToken, title, body, data = {}) {
    try {
      if (!this.serverKey) {
        throw new Error('FCM_SERVER_KEY environment variable not set');
      }

      if (!fcmToken) {
        throw new Error('FCM token is required');
      }

      const payload = {
        to: fcmToken,
        notification: {
          title: title,
          body: body,
          sound: 'default',
          badge: 1
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        priority: 'high',
        time_to_live: 3600 // 1 hour
      };

      const response = await fetch(this.fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`FCM request failed: ${result.error || 'Unknown error'}`);
      }

      logger.info('FCM notification sent successfully', { 
        fcmToken: fcmToken.substring(0, 20) + '...',
        messageId: result.message_id,
        success: result.success 
      });

      return {
        success: true,
        messageId: result.message_id,
        successCount: result.success || 0,
        failureCount: result.failure || 0,
        data: result
      };

    } catch (error) {
      logger.error('Error sending FCM notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendLockCommand(fcmToken, deviceInfo = {}) {
    const lockData = {
      command: 'LOCK_DEVICE',
      action: 'lock',
      deviceInfo: deviceInfo,
      timestamp: new Date().toISOString()
    };

    return await this.sendNotificationToDevice(
      fcmToken,
      'Device Lock Command',
      'Your device has been locked by the administrator',
      lockData
    );
  }

  async sendUnlockCommand(fcmToken, deviceInfo = {}) {
    const unlockData = {
      command: 'UNLOCK_DEVICE',
      action: 'unlock',
      deviceInfo: deviceInfo,
      timestamp: new Date().toISOString()
    };

    return await this.sendNotificationToDevice(
      fcmToken,
      'Device Unlock Command',
      'Your device has been unlocked by the administrator',
      unlockData
    );
  }

  async sendWipeCommand(fcmToken, deviceInfo = {}) {
    const wipeData = {
      command: 'WIPE_DEVICE',
      action: 'wipe',
      deviceInfo: deviceInfo,
      timestamp: new Date().toISOString()
    };

    return await this.sendNotificationToDevice(
      fcmToken,
      'Device Wipe Command',
      'Your device will be wiped by the administrator',
      wipeData
    );
  }

  async sendCustomCommand(fcmToken, command, title, body, data = {}) {
    const commandData = {
      command: command,
      action: command.toLowerCase(),
      ...data,
      timestamp: new Date().toISOString()
    };

    return await this.sendNotificationToDevice(
      fcmToken,
      title,
      body,
      commandData
    );
  }
}

// Device Database with FCM token support
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
    return this.devices.get(identifier) || null;
  }

  async updateDeviceFCMToken(identifier, fcmToken) {
    const device = this.devices.get(identifier);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      fcmToken: fcmToken,
      lastSeen: new Date().toISOString(),
    };

    // Update both IMEI and androidId entries
    this.devices.set(device.imei, updatedDevice);
    if (device.androidId) {
      this.devices.set(device.androidId, updatedDevice);
    }
    
    logger.info(`FCM token updated: IMEI ${device.imei}, AndroidId ${device.androidId}`, { fcmToken: fcmToken.substring(0, 20) + '...' });
    
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
    const devices = Array.from(this.devices.values());
    const uniqueDevices = devices.filter((device, index, self) => 
      index === self.findIndex(d => d.id === device.id)
    );
    return uniqueDevices;
  }
}

// Singleton instances
const fcmService = new FCMService();
const deviceDatabase = new DeviceDatabase();

// FCM Database Service
class FCMDatabaseService {
  static async updateFCMToken(identifier, fcmToken) {
    try {
      const device = await deviceDatabase.updateDeviceFCMToken(identifier, fcmToken);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'FCM token updated successfully',
      };
    } catch (error) {
      logger.error('Error in updateFCMToken:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async sendLockCommand(identifier) {
    try {
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered',
        };
      }

      // Send FCM lock command
      const fcmResult = await fcmService.sendLockCommand(device.fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status to locked
        const updatedDevice = await deviceDatabase.lockDevice(identifier);
        
        return {
          success: true,
          data: {
            device: updatedDevice,
            fcmResult: fcmResult
          },
          message: 'Lock command sent successfully via FCM',
        };
      } else {
        return {
          success: false,
          error: `Failed to send FCM lock command: ${fcmResult.error}`,
        };
      }
    } catch (error) {
      logger.error('Error in sendLockCommand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async sendUnlockCommand(identifier) {
    try {
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered',
        };
      }

      // Send FCM unlock command
      const fcmResult = await fcmService.sendUnlockCommand(device.fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status to unlocked
        const updatedDevice = await deviceDatabase.unlockDevice(identifier);
        
        return {
          success: true,
          data: {
            device: updatedDevice,
            fcmResult: fcmResult
          },
          message: 'Unlock command sent successfully via FCM',
        };
      } else {
        return {
          success: false,
          error: `Failed to send FCM unlock command: ${fcmResult.error}`,
        };
      }
    } catch (error) {
      logger.error('Error in sendUnlockCommand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async sendCustomCommand(identifier, command, title, body, data = {}) {
    try {
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered',
        };
      }

      // Send FCM custom command
      const fcmResult = await fcmService.sendCustomCommand(
        device.fcmToken, 
        command, 
        title, 
        body, 
        {
          ...data,
          deviceInfo: {
            imei: device.imei,
            androidId: device.androidId,
            deviceName: device.deviceName,
            model: device.model
          }
        }
      );

      return {
        success: fcmResult.success,
        data: {
          device: device,
          fcmResult: fcmResult
        },
        message: fcmResult.success ? 'Custom command sent successfully via FCM' : `Failed to send FCM command: ${fcmResult.error}`,
      };
    } catch (error) {
      logger.error('Error in sendCustomCommand:', error);
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
    
    // Remove 'api' and 'fcm' from path segments
    const fcmPath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'POST':
        const requestBody = body ? JSON.parse(body) : {};
        
        if (fcmPath === 'update-token') {
          // POST /api/fcm/update-token - Update FCM token for device
          return await handleUpdateFCMToken(requestBody, headers);
        } else if (fcmPath === 'lock') {
          // POST /api/fcm/lock - Send lock command via FCM
          return await handleFCMLock(requestBody, headers);
        } else if (fcmPath === 'unlock') {
          // POST /api/fcm/unlock - Send unlock command via FCM
          return await handleFCMUnlock(requestBody, headers);
        } else if (fcmPath === 'custom-command') {
          // POST /api/fcm/custom-command - Send custom command via FCM
          return await handleFCMCustomCommand(requestBody, headers);
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
    logger.error('Error in FCM function:', error);
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

async function handleUpdateFCMToken(requestBody, headers) {
  try {
    const { imei, androidId, fcmToken } = requestBody;
    
    if (!fcmToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'FCM token is required',
        }),
      };
    }

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
    const result = await FCMDatabaseService.updateFCMToken(identifier, fcmToken);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleUpdateFCMToken:', error);
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

async function handleFCMLock(requestBody, headers) {
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
    const result = await FCMDatabaseService.sendLockCommand(identifier);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleFCMLock:', error);
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

async function handleFCMUnlock(requestBody, headers) {
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
    const result = await FCMDatabaseService.sendUnlockCommand(identifier);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleFCMUnlock:', error);
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

async function handleFCMCustomCommand(requestBody, headers) {
  try {
    const { imei, androidId, command, title, body, data } = requestBody;
    
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

    if (!command || !title || !body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'command, title, and body are required',
        }),
      };
    }

    const identifier = imei || androidId;
    const result = await FCMDatabaseService.sendCustomCommand(identifier, command, title, body, data || {});
    
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error in handleFCMCustomCommand:', error);
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
