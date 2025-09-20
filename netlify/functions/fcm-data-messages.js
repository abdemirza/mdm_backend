// FCM Data Messages Service for MDM Commands
// Uses data messages instead of push notifications for better reliability
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Real FCM Service using Firebase Admin SDK
class RealFCMService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.clientId = process.env.FIREBASE_CLIENT_ID;
    this.privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
  }

  async getAccessToken() {
    try {
      const jwt = await this.createJWT();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`OAuth2 token request failed: ${result.error_description || result.error}`);
      }

      return result.access_token;
    } catch (error) {
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  async createJWT() {
    const crypto = await import('crypto');
    
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.privateKeyId
    };

    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${headerBase64}.${payloadBase64}`;
    
    const signature = crypto.sign('sha256', Buffer.from(signatureInput), {
      key: this.privateKey.replace(/\\n/g, '\n'),
      padding: crypto.constants.RSA_PKCS1_PADDING
    });

    const signatureBase64 = signature.toString('base64url');
    return `${signatureInput}.${signatureBase64}`;
  }

  // Send data message (no notification, just data payload)
  async sendDataMessage(fcmToken, data, options = {}) {
    try {
      logger.info('Sending FCM data message', {
        fcmToken: fcmToken.substring(0, 20) + '...',
        data: data
      });

      const accessToken = await this.getAccessToken();
      
      // Ensure all data values are strings (FCM requirement)
      const stringData = {};
      Object.keys(data).forEach(key => {
        stringData[key] = String(data[key]);
      });
      
      const message = {
        message: {
          token: fcmToken,
          data: {
            ...stringData,
            timestamp: new Date().toISOString()
          },
          android: {
            priority: 'high',
            ttl: options.ttl || '3600s',
            data: {
              ...stringData,
              timestamp: new Date().toISOString()
            }
          },
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                'content-available': 1
              }
            }
          }
        }
      };

      logger.info('Sending FCM data message request', {
        projectId: this.projectId,
        fcmToken: fcmToken.substring(0, 20) + '...',
        message: message
      });

      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      const result = await response.json();

      logger.info('FCM data message response received', {
        status: response.status,
        ok: response.ok,
        result: result
      });

      if (!response.ok) {
        logger.error('FCM data message request failed', {
          status: response.status,
          error: result.error,
          message: result.error?.message
        });
        throw new Error(`FCM data message request failed: ${result.error?.message || 'Unknown error'}`);
      }

      logger.info('FCM data message sent successfully', { 
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
      logger.error('Error sending FCM data message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send lock command as data message
  async sendLockCommand(fcmToken, deviceInfo = {}) {
    const lockData = {
      command: 'LOCK_DEVICE',
      action: 'lock',
      device_imei: deviceInfo.imei || '',
      device_android_id: deviceInfo.androidId || '',
      device_name: deviceInfo.deviceName || '',
      device_model: deviceInfo.model || '',
      timestamp: new Date().toISOString()
    };

    return await this.sendDataMessage(fcmToken, lockData, {
      ttl: '3600s' // 1 hour TTL
    });
  }

  // Send unlock command as data message
  async sendUnlockCommand(fcmToken, deviceInfo = {}) {
    const unlockData = {
      command: 'UNLOCK_DEVICE',
      action: 'unlock',
      device_imei: deviceInfo.imei || '',
      device_android_id: deviceInfo.androidId || '',
      device_name: deviceInfo.deviceName || '',
      device_model: deviceInfo.model || '',
      timestamp: new Date().toISOString()
    };

    return await this.sendDataMessage(fcmToken, unlockData, {
      ttl: '3600s' // 1 hour TTL
    });
  }

  // Send custom command as data message
  async sendCustomCommand(fcmToken, command, data = {}) {
    const commandData = {
      command: command.toUpperCase(),
      action: command.toLowerCase(),
      ...data,
      timestamp: new Date().toISOString()
    };

    return await this.sendDataMessage(fcmToken, commandData, {
      ttl: '3600s' // 1 hour TTL
    });
  }

  // Send test data message
  async sendTestDataMessage(fcmToken, testData = {}) {
    const testMessageData = {
      command: 'TEST_MESSAGE',
      action: 'test',
      message: 'This is a test data message from MDM server',
      ...testData,
      timestamp: new Date().toISOString()
    };

    return await this.sendDataMessage(fcmToken, testMessageData, {
      ttl: '300s' // 5 minutes TTL for test messages
    });
  }
}

// FCM Database Service for data messages
class FCMDatabaseService {
  static async getDeviceFromCustomDevices(identifier) {
    try {
      // Make HTTP call to custom devices API
      const response = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Custom devices API call failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Find device by IMEI or androidId
        const matchingDevices = result.data.filter(d => 
          d.imei === identifier || d.androidId === identifier
        );
        
        if (matchingDevices.length === 0) {
          return null;
        }
        
        // If multiple devices match, prefer the one with a valid FCM token
        if (matchingDevices.length > 1) {
          const deviceWithToken = matchingDevices.find(d => 
            d.fcmToken && !d.fcmToken.startsWith('test_')
          );
          if (deviceWithToken) {
            return deviceWithToken;
          }
        }
        
        // Return the first matching device
        return matchingDevices[0];
      }
      
      return null;
    } catch (error) {
      logger.error('Error fetching device from custom devices API:', error);
      return null;
    }
  }

  static async updateFCMToken(identifier, fcmToken) {
    try {
      const response = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imei: identifier,
          fcmToken: fcmToken,
          lastSeen: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update device FCM token: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      throw error;
    }
  }

  static async sendLockCommand(identifier) {
    try {
      // First, get the device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      // For testing purposes, use a default FCM token if none is registered
      const fcmToken = device.fcmToken || 'test_fcm_token_' + device.androidId;

      // Send FCM data message for lock command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendLockCommand(fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status in the database to locked
        const updateResponse = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            androidId: device.androidId,
            imei: device.imei,
            isLocked: true,
            status: 'locked',
            lastLockTime: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          })
        });

        if (!updateResponse.ok) {
          logger.warn('FCM lock command sent but failed to update device status in database');
        }

        const updatedDevice = {
          ...device,
          isLocked: true,
          lastLockTime: new Date().toISOString(),
          status: 'locked',
          lastSeen: new Date().toISOString()
        };

        return {
          success: true,
          data: {
            device: updatedDevice,
            fcmResult: fcmResult,
            databaseUpdated: updateResponse.ok
          },
          message: 'Lock command sent successfully via FCM data message and device status updated in database',
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
      // First, get the device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      // For testing purposes, use a default FCM token if none is registered
      const fcmToken = device.fcmToken || 'test_fcm_token_' + device.androidId;

      // Send FCM data message for unlock command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendUnlockCommand(fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status in the database to unlocked
        const updateResponse = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            androidId: device.androidId,
            imei: device.imei,
            isLocked: false,
            status: 'active',
            lastUnlockTime: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          })
        });

        if (!updateResponse.ok) {
          logger.warn('FCM unlock command sent but failed to update device status in database');
        }

        const updatedDevice = {
          ...device,
          isLocked: false,
          lastUnlockTime: new Date().toISOString(),
          status: 'active',
          lastSeen: new Date().toISOString()
        };

        return {
          success: true,
          data: {
            device: updatedDevice,
            fcmResult: fcmResult,
            databaseUpdated: updateResponse.ok
          },
          message: 'Unlock command sent successfully via FCM data message and device status updated in database',
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

  static async sendCustomCommand(identifier, command, data = {}) {
    try {
      // First, get the device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      // For testing purposes, use a default FCM token if none is registered
      const fcmToken = device.fcmToken || 'test_fcm_token_' + device.androidId;

      // Send FCM data message for custom command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendCustomCommand(fcmToken, command, {
        device_imei: device.imei,
        device_android_id: device.androidId,
        device_name: device.deviceName,
        device_model: device.model,
        ...data
      });

      if (fcmResult.success) {
        // Update device last seen time
        const updateResponse = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            androidId: device.androidId,
            imei: device.imei,
            lastSeen: new Date().toISOString()
          })
        });

        if (!updateResponse.ok) {
          logger.warn('FCM custom command sent but failed to update device last seen time in database');
        }

        return {
          success: true,
          data: {
            device: device,
            fcmResult: fcmResult,
            databaseUpdated: updateResponse.ok
          },
          message: 'Custom command sent successfully via FCM data message',
        };
      } else {
        return {
          success: false,
          error: `Failed to send FCM custom command: ${fcmResult.error}`,
        };
      }
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
    
    // Remove 'api' and 'fcm-data' from path segments
    const fcmPath = pathSegments.slice(2).join('/');
    const requestBody = body ? JSON.parse(body) : {};

    logger.info('FCM Data Messages API request', {
      method: httpMethod,
      path: fcmPath,
      body: requestBody
    });

    switch (httpMethod) {
      case 'POST':
        if (fcmPath === 'lock') {
          // POST /api/fcm-data/lock - Send lock command via FCM data message
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

        } else if (fcmPath === 'unlock') {
          // POST /api/fcm-data/unlock - Send unlock command via FCM data message
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

        } else if (fcmPath === 'custom-command') {
          // POST /api/fcm-data/custom-command - Send custom command via FCM data message
          const { imei, androidId, command, data } = requestBody;
          
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

          if (!command) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Command is required',
              }),
            };
          }

          const identifier = imei || androidId;
          const result = await FCMDatabaseService.sendCustomCommand(identifier, command, data || {});
          
          return {
            statusCode: result.success ? 200 : 404,
            headers,
            body: JSON.stringify(result),
          };

        } else if (fcmPath === 'test-data-message') {
          // POST /api/fcm-data/test-data-message - Send test data message
          const { fcmToken, testData } = requestBody;
          
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

          const fcmService = new RealFCMService();
          const result = await fcmService.sendTestDataMessage(fcmToken, testData || {});
          
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify({
              success: result.success,
              data: result,
              message: result.success ? 'Test data message sent successfully' : 'Failed to send test data message'
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

      case 'GET':
        if (fcmPath === 'debug-config') {
          // GET /api/fcm-data/debug-config - Check Firebase configuration
          const firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientId: process.env.FIREBASE_CLIENT_ID,
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          };

          const hasAllConfig = !!(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'FCM Data Messages configuration check complete',
              config: {
                projectId: firebaseConfig.projectId ? 'SET' : 'NOT_SET',
                clientEmail: firebaseConfig.clientEmail ? 'SET' : 'NOT_SET',
                privateKey: firebaseConfig.privateKey ? 'SET' : 'NOT_SET',
                privateKeyLength: firebaseConfig.privateKey?.length || 0,
                clientId: firebaseConfig.clientId ? 'SET' : 'NOT_SET',
                privateKeyId: firebaseConfig.privateKeyId ? 'SET' : 'NOT_SET',
              },
              hasAllConfig: hasAllConfig,
              details: hasAllConfig ? 'All required Firebase environment variables are set for data messages.' : 'Some Firebase environment variables are missing or empty.',
            }),
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'GET endpoint not found',
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
    logger.error('Error in FCM data messages function:', error);
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
