// Minimal FCM Service - No Firebase authentication, just basic functionality
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Minimal FCM Service - Simulates FCM without actual Firebase calls
class MinimalFCMService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'ub-mapp-sandbox';
  }

  async sendNotificationToDevice(fcmToken, title, body, data = {}) {
    try {
      if (!fcmToken) {
        throw new Error('FCM token is required');
      }

      // Simulate FCM call (for testing purposes)
      logger.info('Simulating FCM notification', { 
        fcmToken: fcmToken.substring(0, 20) + '...',
        title,
        body,
        data
      });

      // Return success response (simulated)
      return {
        success: true,
        messageId: `simulated_${Date.now()}`,
        successCount: 1,
        failureCount: 0,
        data: {
          name: `projects/${this.projectId}/messages/simulated_${Date.now()}`,
          message: {
            token: fcmToken,
            notification: { title, body },
            data: data
          }
        }
      };

    } catch (error) {
      logger.error('Error in simulated FCM notification:', error);
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

// FCM Database Service that integrates with Custom Devices API
class FCMDatabaseService {
  static async getDeviceFromCustomDevices(identifier) {
    try {
      // Import the custom devices service
      const { DeviceDatabaseService } = await import('./custom-devices.js');
      const customDeviceService = DeviceDatabaseService.getInstance();
      
      // Get all devices from custom devices service
      const devices = await customDeviceService.getAllDevices();
      
      if (devices.success && devices.data) {
        // Find device by IMEI or androidId
        const device = devices.data.find(d => 
          d.imei === identifier || d.androidId === identifier
        );
        return device || null;
      }
      
      return null;
    } catch (error) {
      logger.error('Error fetching device from custom devices service:', error);
      return null;
    }
  }

  static async updateDeviceFCMToken(identifier, fcmToken) {
    try {
      // First, get the device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      // Update the device with FCM token using custom devices service
      const { DeviceDatabaseService } = await import('./custom-devices.js');
      const customDeviceService = DeviceDatabaseService.getInstance();
      
      // Update device status with FCM token
      const updateResult = await customDeviceService.updateDeviceStatus(identifier, {
        fcmToken: fcmToken,
        lastSeen: new Date().toISOString()
      });

      if (updateResult.success) {
        return {
          success: true,
          data: updateResult.data,
          message: 'FCM token updated successfully',
        };
      } else {
        return {
          success: false,
          error: 'Failed to update FCM token in custom devices database',
        };
      }
    } catch (error) {
      logger.error('Error in updateFCMToken:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

// Singleton instances
const fcmService = new MinimalFCMService();

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
        message: 'FCM token updated successfully (simulated)',
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
      // Get device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
        };
      }

      // Send simulated FCM lock command
      const fcmResult = await fcmService.sendLockCommand(device.fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status to locked using custom devices service
        const { DeviceDatabaseService } = await import('./custom-devices.js');
        const customDeviceService = DeviceDatabaseService.getInstance();
        
        const lockResult = await customDeviceService.lockDevice(identifier);
        
        return {
          success: true,
          data: {
            device: lockResult.data,
            fcmResult: fcmResult
          },
          message: 'Lock command sent successfully via FCM (simulated)',
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
      // Get device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
        };
      }

      // Send simulated FCM unlock command
      const fcmResult = await fcmService.sendUnlockCommand(device.fcmToken, {
        imei: device.imei,
        androidId: device.androidId,
        deviceName: device.deviceName,
        model: device.model
      });

      if (fcmResult.success) {
        // Update device status to unlocked using custom devices service
        const { DeviceDatabaseService } = await import('./custom-devices.js');
        const customDeviceService = DeviceDatabaseService.getInstance();
        
        const unlockResult = await customDeviceService.unlockDevice(identifier);
        
        return {
          success: true,
          data: {
            device: unlockResult.data,
            fcmResult: fcmResult
          },
          message: 'Unlock command sent successfully via FCM (simulated)',
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
      // Get device from custom devices service
      const device = await this.getDeviceFromCustomDevices(identifier);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found in custom devices database. Please register the device first using /api/custom-devices/register',
        };
      }

      if (!device.fcmToken) {
        return {
          success: false,
          error: 'Device does not have FCM token registered. Please register FCM token first.',
        };
      }

      // Send simulated FCM custom command
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
        message: fcmResult.success ? 'Custom command sent successfully via FCM (simulated)' : `Failed to send FCM command: ${fcmResult.error}`,
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

// Main handler function closing
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
}
