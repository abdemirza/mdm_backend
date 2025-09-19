// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Optimized FCM Service using individual environment variables instead of large JSON
class OptimizedFCMService {
  constructor() {
    // Use individual environment variables instead of large JSON
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
    this.clientId = process.env.FIREBASE_CLIENT_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      if (!this.clientEmail || !this.privateKey || !this.projectId) {
        throw new Error('Firebase environment variables not set. Please set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID');
      }

      // Create JWT for authentication
      const jwt = await this.createJWT();
      
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

  async createJWT() {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.clientEmail,
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
    const signature = sign.sign(this.privateKey, 'base64url');

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

// Simple in-memory device database
class SimpleDeviceDatabase {
  constructor() {
    this.devices = new Map();
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

    this.devices.set(identifier, updatedDevice);
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

    this.devices.set(identifier, updatedDevice);
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

    this.devices.set(identifier, updatedDevice);
    return updatedDevice;
  }
}

// Singleton instances
const fcmService = new OptimizedFCMService();
const deviceDatabase = new SimpleDeviceDatabase();

// FCM Database Service
class FCMDatabaseService {
  static async updateFCMToken(identifier, fcmToken) {
    try {
      // Check if device exists in our local database
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found. Please register the device first using /api/custom-devices/register',
        };
      }

      // Update the device with FCM token
      const updatedDevice = await deviceDatabase.updateDeviceFCMToken(identifier, fcmToken);
      
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
      // Get device from local database
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found. Please register the device first using /api/custom-devices/register',
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
      // Get device from local database
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found. Please register the device first using /api/custom-devices/register',
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
      // Get device from local database
      const device = await deviceDatabase.getDevice(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found. Please register the device first using /api/custom-devices/register',
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
