// Firebase Firestore-based Custom Devices API for Netlify Functions (Fixed)
const https = require('https');

const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Firebase Firestore Service (Fixed)
class FirestoreService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
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
          assertion: jwt,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer
      
      logger.info('Firebase access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Error getting Firebase access token:', error);
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
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const unsignedToken = Buffer.from(JSON.stringify(header)).toString('base64url') + '.' + 
                         Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const crypto = await import('crypto');
    
    // Format the private key properly for Node.js crypto
    const privateKey = this.privateKey.replace(/\\n/g, '\n');
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    
    const signature = sign.sign(privateKey, 'base64url');
    return `${unsignedToken}.${signature}`;
  }

  async makeFirestoreRequest(method, path, data = null) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents${path}`;
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      logger.info(`Making Firestore request: ${method} ${url}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Firestore request failed: ${response.status} ${response.statusText}`, { errorText });
        throw new Error(`Firestore request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      logger.info(`Firestore request successful: ${method} ${path}`);
      return result;
    } catch (error) {
      logger.error('Error making Firestore request:', error);
      throw error;
    }
  }

  async registerDevice(deviceData) {
    try {
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const device = {
        id: deviceId,
        ...deviceData,
        isLocked: false,
        registeredAt: new Date().toISOString(),
        status: 'active',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if device already exists by IMEI or androidId
      const existingDevice = await this.getDeviceByField('imei', deviceData.imei) || 
                            await this.getDeviceByField('androidId', deviceData.androidId);

      if (existingDevice) {
        // Update existing device
        const updateData = {
          fields: this.convertToFirestoreFields({
            ...deviceData,
            lastSeen: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        };

        await this.makeFirestoreRequest('PATCH', `/devices/${existingDevice.id}`, updateData);
        logger.info(`Device updated: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`);
        return await this.getDeviceById(existingDevice.id);
      } else {
        // Create new device
        const createData = {
          fields: this.convertToFirestoreFields(device)
        };

        await this.makeFirestoreRequest('POST', `/devices?documentId=${deviceId}`, createData);
        logger.info(`Device registered: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`, { deviceId });
        return await this.getDeviceById(deviceId);
      }
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDeviceById(deviceId) {
    try {
      const response = await this.makeFirestoreRequest('GET', `/devices/${deviceId}`);
      return this.convertFromFirestoreFields(response);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      logger.error('Error getting device by ID:', error);
      throw error;
    }
  }

  async getDeviceByField(fieldName, value) {
    try {
      // Use Firestore query format
      const query = {
        structuredQuery: {
          where: {
            fieldFilter: {
              field: { fieldPath: fieldName },
              op: 'EQUAL',
              value: { stringValue: value }
            }
          },
          from: [{ collectionId: 'devices' }]
        }
      };

      const response = await this.makeFirestoreRequest('POST', '/devices:runQuery', query);
      
      if (response && response.length > 0) {
        return this.convertFromFirestoreFields(response[0].document);
      }
      return null;
    } catch (error) {
      logger.error('Error getting device by field:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    try {
      // Try to get device by IMEI first, then by androidId
      let device = await this.getDeviceByField('imei', identifier);
      if (!device) {
        device = await this.getDeviceByField('androidId', identifier);
      }
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(identifier, updates) {
    try {
      const device = await this.getDevice(identifier);
      if (!device) {
        return null;
      }

      const updateData = {
        fields: this.convertToFirestoreFields({
          ...updates,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      };

      await this.makeFirestoreRequest('PATCH', `/devices/${device.id}`, updateData);
      logger.info(`Device status updated: ${identifier}`, { updates });
      return await this.getDeviceById(device.id);
    } catch (error) {
      logger.error('Error updating device status:', error);
      throw error;
    }
  }

  async lockDevice(identifier) {
    try {
      const device = await this.getDevice(identifier);
      if (!device) {
        return null;
      }

      const updateData = {
        fields: this.convertToFirestoreFields({
          isLocked: true,
          status: 'locked',
          lastLockTime: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      };

      await this.makeFirestoreRequest('PATCH', `/devices/${device.id}`, updateData);
      logger.info(`Device locked: ${identifier}`);
      return await this.getDeviceById(device.id);
    } catch (error) {
      logger.error('Error locking device:', error);
      throw error;
    }
  }

  async unlockDevice(identifier) {
    try {
      const device = await this.getDevice(identifier);
      if (!device) {
        return null;
      }

      const updateData = {
        fields: this.convertToFirestoreFields({
          isLocked: false,
          status: 'active',
          lastUnlockTime: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      };

      await this.makeFirestoreRequest('PATCH', `/devices/${device.id}`, updateData);
      logger.info(`Device unlocked: ${identifier}`);
      return await this.getDeviceById(device.id);
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const response = await this.makeFirestoreRequest('GET', '/devices');
      if (response.documents) {
        return response.documents.map(doc => this.convertFromFirestoreFields(doc));
      }
      return [];
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      const query = {
        structuredQuery: {
          where: {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: status }
            }
          },
          from: [{ collectionId: 'devices' }]
        }
      };

      const response = await this.makeFirestoreRequest('POST', '/devices:runQuery', query);
      
      if (response && response.length > 0) {
        return response.map(item => this.convertFromFirestoreFields(item.document));
      }
      return [];
    } catch (error) {
      logger.error('Error getting devices by status:', error);
      throw error;
    }
  }

  convertToFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        fields[key] = { integerValue: value.toString() };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      } else if (value === null) {
        fields[key] = { nullValue: null };
      }
    }
    return fields;
  }

  convertFromFirestoreFields(doc) {
    if (!doc.fields) return null;
    
    const obj = {};
    for (const [key, field] of Object.entries(doc.fields)) {
      if (field.stringValue !== undefined) {
        obj[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        obj[key] = parseInt(field.integerValue);
      } else if (field.booleanValue !== undefined) {
        obj[key] = field.booleanValue;
      } else if (field.timestampValue !== undefined) {
        obj[key] = field.timestampValue;
      } else if (field.nullValue !== undefined) {
        obj[key] = null;
      }
    }
    
    // Add document ID
    if (doc.name) {
      const pathParts = doc.name.split('/');
      obj.id = pathParts[pathParts.length - 1];
    }
    
    return obj;
  }
}

// Device Database Service using Firestore
class DeviceDatabase {
  constructor() {
    this.firestore = new FirestoreService();
  }

  async registerDevice(deviceData) {
    try {
      const device = await this.firestore.registerDevice(deviceData);
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    try {
      const device = await this.firestore.getDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(identifier, updates) {
    try {
      const device = await this.firestore.updateDeviceStatus(identifier, updates);
      return device;
    } catch (error) {
      logger.error('Error updating device status:', error);
      throw error;
    }
  }

  async lockDevice(identifier) {
    try {
      const device = await this.firestore.lockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error locking device:', error);
      throw error;
    }
  }

  async unlockDevice(identifier) {
    try {
      const device = await this.firestore.unlockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const devices = await this.firestore.getAllDevices();
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      const devices = await this.firestore.getDevicesByStatus(status);
      return devices;
    } catch (error) {
      logger.error('Error getting devices by status:', error);
      throw error;
    }
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
        message: 'Device registered successfully in Firestore',
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
        message: 'Device locked successfully in Firestore',
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
        message: 'Device unlocked successfully in Firestore',
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
        message: device ? 'Device status updated successfully in Firestore' : 'Device not found'
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
              message: `Found ${devices.length} devices in Firestore`
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
              message: `Found ${devices.length} devices with status: ${status} in Firestore`
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
              message: device ? 'Device found in Firestore' : 'Device not found'
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
