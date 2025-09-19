// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// FCM Service for sending push notifications to devices using Firebase Admin SDK
class FCMService {
  constructor() {
    this.serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      if (!this.serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
      }

      if (!this.projectId) {
        throw new Error('FIREBASE_PROJECT_ID environment variable not set');
      }

      // Parse the service account key
      const serviceAccount = JSON.parse(this.serviceAccountKey);
      
      // Create JWT for authentication
      const jwt = await this.createJWT(serviceAccount);
      
      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown error'}`);
      }

      // Cache the token
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;

    } catch (error) {
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  async createJWT(serviceAccount) {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600 // 1 hour
    };

    // Create JWT header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Sign with private key
    const crypto = require('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');

    return `${unsignedToken}.${signature}`;
  }

  async sendNotificationToDevice(fcmToken, title, body, data = {}) {
    try {
      if (!fcmToken) {
        throw new Error('FCM token is required');
      }

      const accessToken = await this.getAccessToken();
      
      const message = {
        message: {
          token: fcmToken,
          notification: {
            title: title,
            body: body
          },
          data: {
            ...data,
            timestamp: new Date().toISOString()
          },
          android: {
            priority: 'high',
            ttl: '3600s'
          },
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        }
      };

      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`FCM request failed: ${result.error?.message || 'Unknown error'}`);
      }

      logger.info('FCM notification sent successfully', { 
        fcmToken: fcmToken.substring(0, 20) + '...',
        messageId: result.name,
        success: true 
      });

      return {
        success: true,
        messageId: result.name,
        successCount: 1,
        failureCount: 0,
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
      // Use shared device database
      const sharedDb = await import('./shared-device-database.js');
      const database = sharedDb.getSharedDeviceDatabase();
      
      // Check if device exists
      const device = await database.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in database',
        };
      }

      // Update the device with FCM token
      const updatedDevice = await database.updateDeviceFCMToken(identifier, fcmToken);
      
      if (!updatedDevice) {
        return {
          success: false,
          error: 'Failed to update FCM token',
        };
      }

      return {
        success: true,
        data: updatedDevice,
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
      // Use shared device database
      const sharedDb = await import('./shared-device-database.js');
      const database = sharedDb.getSharedDeviceDatabase();
      
      // Get device from shared database
      const device = await database.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in database',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
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
        // Update device status to locked in shared database
        const updatedDevice = await database.lockDevice(identifier);
        
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
      // Use shared device database
      const sharedDb = await import('./shared-device-database.js');
      const database = sharedDb.getSharedDeviceDatabase();
      
      // Get device from shared database
      const device = await database.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in database',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
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
        // Update device status to unlocked in shared database
        const updatedDevice = await database.unlockDevice(identifier);
        
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
      // Use shared device database
      const sharedDb = await import('./shared-device-database.js');
      const database = sharedDb.getSharedDeviceDatabase();
      
      // Get device from shared database
      const device = await database.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in database',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
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



