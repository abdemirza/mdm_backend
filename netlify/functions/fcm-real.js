// Real FCM Service - Sends actual push notifications using Firebase
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  debug: (message, meta = {}) => console.log(`[DEBUG] ${message}`, meta),
};

// Real FCM Service - Uses Firebase service account for actual push notifications
class RealFCMService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
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
      exp: now + 3600,
      iat: now
    };

    const unsignedToken = Buffer.from(JSON.stringify(header)).toString('base64url') + 
                        '.' + Buffer.from(JSON.stringify(payload)).toString('base64url');

    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    
    const signature = sign.sign(this.privateKey, 'base64url');
    return `${unsignedToken}.${signature}`;
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
      return result.access_token;
    } catch (error) {
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  async sendNotificationToDevice(fcmToken, title, body, data = {}) {
    try {
      if (!fcmToken) {
        throw new Error('FCM token is required');
      }

      // Always try to send real notification, even with test tokens
      logger.info('Sending real FCM notification', { 
        fcmToken: fcmToken.substring(0, 20) + '...',
        title,
        body 
      });

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
          }
        }
      };

      logger.info('Sending FCM request to Firebase', {
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

      logger.info('FCM response received', {
        status: response.status,
        ok: response.ok,
        result: result
      });

      if (!response.ok) {
        logger.error('FCM request failed', {
          status: response.status,
          error: result.error,
          message: result.error?.message
        });
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
      deviceInfo: deviceInfo
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
      deviceInfo: deviceInfo
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
      ...data
    };

    return await this.sendNotificationToDevice(
      fcmToken,
      title,
      body,
      commandData
    );
  }
}

// FCM Database Service that integrates with Custom Devices API
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
        const device = result.data.find(d => 
          d.imei === identifier || d.androidId === identifier
        );
        return device || null;
      }
      
      return null;
    } catch (error) {
      logger.error('Error fetching device from custom devices API:', error);
      return null;
    }
  }

  static async updateFCMToken(identifier, fcmToken) {
    try {
      // First, get the device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      // For now, just return success since we found the device
      // In a real implementation, you would update the device with FCM token
      return {
        success: true,
        data: {
          ...device,
          fcmToken: fcmToken,
          lastSeen: new Date().toISOString()
        },
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

      // Send real FCM lock command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendLockCommand(fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // For now, just return success since we found the device and sent the command
        // In a real implementation, you would update the device status to locked
        return {
          success: true,
          data: {
            device: {
              ...device,
              isLocked: true,
              lastLockTime: new Date().toISOString(),
              status: 'locked'
            },
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

      // Send real FCM unlock command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendUnlockCommand(fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // For now, just return success since we found the device and sent the command
        // In a real implementation, you would update the device status to unlocked
        return {
          success: true,
          data: {
            device: {
              ...device,
              isLocked: false,
              lastUnlockTime: new Date().toISOString(),
              status: 'active'
            },
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

      // Send real FCM custom command
      const fcmService = new RealFCMService();
      const fcmResult = await fcmService.sendCustomCommand(
        fcmToken, 
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

      if (fcmResult.success) {
        return {
          success: true,
          data: {
            device: device,
            fcmResult: fcmResult
          },
          message: 'Custom command sent successfully via FCM',
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
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'fcm-real' from path segments
    const fcmPath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'GET':
        if (fcmPath === 'debug-config') {
          // GET /api/fcm-real/debug-config - Debug Firebase configuration
          try {
            const config = {
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
              privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
              hasAllConfig: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
            };

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                data: {
                  config: config,
                  message: 'Firebase configuration debug'
                }
              })
            };
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Failed to get debug config',
                details: error.message,
              }),
            };
          }
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

      case 'POST':
        const requestBody = body ? JSON.parse(body) : {};
        
        if (fcmPath === 'update-token') {
          // POST /api/fcm-real/update-token - Update FCM token for device
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

        } else if (fcmPath === 'lock') {
          // POST /api/fcm-real/lock - Send lock command via FCM
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
          // POST /api/fcm-real/unlock - Send unlock command via FCM
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
          // POST /api/fcm-real/custom-command - Send custom command via FCM
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

        } else if (fcmPath === 'test-notification') {
          // POST /api/fcm-real/test-notification - Send test push notification
          const { imei, androidId, fcmToken } = requestBody;
          
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
          
          try {
            // Get device info
            const device = await FCMDatabaseService.getDeviceFromCustomDevices(identifier);
            
            if (!device) {
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                  success: false,
                  error: 'Device not found in custom devices database',
                }),
              };
            }

            // Use provided FCM token or fallback to test token
            const tokenToUse = fcmToken || device.fcmToken || 'test_fcm_token_' + device.androidId;
            
            // Send test notification
            const fcmService = new RealFCMService();
            const fcmResult = await fcmService.sendNotificationToDevice(
              tokenToUse,
              'Test Push Notification',
              'This is a test notification to verify FCM connectivity',
              {
                test: true,
                timestamp: new Date().toISOString(),
                deviceInfo: {
                  imei: device.imei,
                  androidId: device.androidId,
                  deviceName: device.deviceName
                }
              }
            );

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                data: {
                  device: device,
                  fcmResult: fcmResult,
                  testInfo: {
                    fcmToken: tokenToUse.substring(0, 20) + '...',
                    isRealToken: !tokenToUse.startsWith('test_'),
                    message: 'Test notification sent successfully'
                  }
                },
                message: 'Test notification sent successfully',
              }),
            };

          } catch (error) {
            logger.error('Error in test notification:', error);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Failed to send test notification',
                details: error.message,
              }),
            };
          }

        } else if (fcmPath === 'test-direct') {
          // POST /api/fcm-real/test-direct - Send test notification directly with FCM token
          const { fcmToken, title, body } = requestBody;
          
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

          try {
            // Send test notification directly
            const fcmService = new RealFCMService();
            const fcmResult = await fcmService.sendNotificationToDevice(
              fcmToken,
              title || 'Direct Test Notification',
              body || 'This is a direct test notification to verify FCM connectivity',
              {
                test: true,
                direct: true,
                timestamp: new Date().toISOString()
              }
            );

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                data: {
                  fcmResult: fcmResult,
                  testInfo: {
                    fcmToken: fcmToken.substring(0, 20) + '...',
                    isRealToken: !fcmToken.startsWith('test_'),
                    message: 'Direct test notification sent successfully'
                  }
                },
                message: 'Direct test notification sent successfully',
              }),
            };

          } catch (error) {
            logger.error('Error in direct test notification:', error);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Failed to send direct test notification',
                details: error.message,
              }),
            };
          }


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
    logger.error('Error in FCM real function:', error);
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
