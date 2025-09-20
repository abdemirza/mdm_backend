// Firebase Admin SDK-based Custom Devices API for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Firebase Admin SDK Service
class FirebaseAdminService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return this.db;
    }

    try {
      // Create Firebase Admin SDK configuration
      const serviceAccount = {
        type: "service_account",
        project_id: this.projectId,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: this.privateKey.replace(/\\n/g, '\n'),
        client_email: this.clientEmail,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(this.clientEmail)}`,
        universe_domain: "googleapis.com"
      };

      // Initialize Firebase Admin SDK
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      // Check if app is already initialized
      if (getApps().length === 0) {
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: this.projectId
        });
        this.db = getFirestore(app);
      } else {
        this.db = getFirestore();
      }

      this.initialized = true;
      logger.info('Firebase Admin SDK initialized successfully', { projectId: this.projectId });
      return this.db;
    } catch (error) {
      logger.error('Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }

  async registerDevice(deviceData) {
    try {
      await this.initialize();
      const devicesCollection = this.db.collection('devices');
      
      const device = {
        ...deviceData,
        isLocked: false,
        registeredAt: new Date(),
        status: 'active',
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check if device already exists by IMEI or androidId
      const existingDeviceQuery = await devicesCollection
        .where('imei', '==', deviceData.imei)
        .limit(1)
        .get();

      if (!existingDeviceQuery.empty) {
        // Update existing device
        const existingDoc = existingDeviceQuery.docs[0];
        const updateData = {
          ...deviceData,
          lastSeen: new Date(),
          updatedAt: new Date()
        };
        
        await existingDoc.ref.update(updateData);
        logger.info(`Device updated: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`);
        
        const updatedDoc = await existingDoc.ref.get();
        return { id: existingDoc.id, ...updatedDoc.data() };
      } else {
        // Create new device
        const docRef = await devicesCollection.add(device);
        logger.info(`Device registered: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`, { deviceId: docRef.id });
        
        const newDoc = await docRef.get();
        return { id: docRef.id, ...newDoc.data() };
      }
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDeviceById(deviceId) {
    try {
      await this.initialize();
      const deviceDoc = await this.db.collection('devices').doc(deviceId).get();
      
      if (!deviceDoc.exists) {
        return null;
      }
      
      return { id: deviceDoc.id, ...deviceDoc.data() };
    } catch (error) {
      logger.error('Error getting device by ID:', error);
      throw error;
    }
  }

  async getDeviceByField(fieldName, value) {
    try {
      await this.initialize();
      const devicesCollection = this.db.collection('devices');
      const query = await devicesCollection.where(fieldName, '==', value).limit(1).get();
      
      if (query.empty) {
        return null;
      }
      
      const doc = query.docs[0];
      return { id: doc.id, ...doc.data() };
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
        ...updates,
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('devices').doc(device.id).update(updateData);
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
        isLocked: true,
        status: 'locked',
        lastLockTime: new Date(),
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('devices').doc(device.id).update(updateData);
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
        isLocked: false,
        status: 'active',
        lastUnlockTime: new Date(),
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('devices').doc(device.id).update(updateData);
      logger.info(`Device unlocked: ${identifier}`);
      return await this.getDeviceById(device.id);
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      await this.initialize();
      const devicesCollection = this.db.collection('devices');
      const snapshot = await devicesCollection.get();
      
      const devices = [];
      snapshot.forEach(doc => {
        devices.push({ id: doc.id, ...doc.data() });
      });
      
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      await this.initialize();
      const devicesCollection = this.db.collection('devices');
      const query = await devicesCollection.where('status', '==', status).get();
      
      const devices = [];
      query.forEach(doc => {
        devices.push({ id: doc.id, ...doc.data() });
      });
      
      return devices;
    } catch (error) {
      logger.error('Error getting devices by status:', error);
      throw error;
    }
  }
}

// Device Database Service using Firebase Admin SDK
class DeviceDatabase {
  constructor() {
    this.firebaseAdmin = new FirebaseAdminService();
  }

  async registerDevice(deviceData) {
    try {
      const device = await this.firebaseAdmin.registerDevice(deviceData);
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    try {
      const device = await this.firebaseAdmin.getDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(identifier, updates) {
    try {
      const device = await this.firebaseAdmin.updateDeviceStatus(identifier, updates);
      return device;
    } catch (error) {
      logger.error('Error updating device status:', error);
      throw error;
    }
  }

  async lockDevice(identifier) {
    try {
      const device = await this.firebaseAdmin.lockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error locking device:', error);
      throw error;
    }
  }

  async unlockDevice(identifier) {
    try {
      const device = await this.firebaseAdmin.unlockDevice(identifier);
      return device;
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const devices = await this.firebaseAdmin.getAllDevices();
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      const devices = await this.firebaseAdmin.getDevicesByStatus(status);
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
        message: 'Device registered successfully in Firestore (Firebase Admin SDK)',
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
        message: 'Device locked successfully in Firestore (Firebase Admin SDK)',
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
        message: 'Device unlocked successfully in Firestore (Firebase Admin SDK)',
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
        message: device ? 'Device status updated successfully in Firestore (Firebase Admin SDK)' : 'Device not found'
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
              message: `Found ${devices.length} devices in Firestore (Firebase Admin SDK)`
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
              message: `Found ${devices.length} devices with status: ${status} in Firestore (Firebase Admin SDK)`
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
              message: device ? 'Device found in Firestore (Firebase Admin SDK)' : 'Device not found'
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
