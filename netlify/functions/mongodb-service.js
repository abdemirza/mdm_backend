// MongoDB Database Service for Netlify Functions
const { MongoClient } = require('mongodb');

// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.connectionString = process.env.MONGODB_URI;
    this.databaseName = process.env.MONGODB_DATABASE || 'mdm_backend';
  }

  async connect() {
    try {
      if (!this.client) {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        logger.info('Connected to MongoDB', { database: this.databaseName });
      }
      return this.db;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
    }
  }

  async registerDevice(deviceData) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
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
      const existingDevice = await collection.findOne({
        $or: [
          { imei: deviceData.imei },
          { androidId: deviceData.androidId }
        ]
      });

      if (existingDevice) {
        // Update existing device
        const result = await collection.updateOne(
          { _id: existingDevice._id },
          { 
            $set: {
              ...deviceData,
              lastSeen: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          logger.info(`Device updated: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`);
          return await collection.findOne({ _id: existingDevice._id });
        }
      } else {
        // Insert new device
        const result = await collection.insertOne(device);
        logger.info(`Device registered: IMEI ${deviceData.imei}, AndroidId ${deviceData.androidId}`, { deviceId: result.insertedId });
        return await collection.findOne({ _id: result.insertedId });
      }
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(identifier) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const device = await collection.findOne({
        $or: [
          { imei: identifier },
          { androidId: identifier }
        ]
      });
      
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(identifier, updates) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const updateData = {
        ...updates,
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        {
          $or: [
            { imei: identifier },
            { androidId: identifier }
          ]
        },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Device status updated: ${identifier}`, { updates });
        return await this.getDevice(identifier);
      }
      
      return null;
    } catch (error) {
      logger.error('Error updating device status:', error);
      throw error;
    }
  }

  async lockDevice(identifier) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const updateData = {
        isLocked: true,
        status: 'locked',
        lastLockTime: new Date(),
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        {
          $or: [
            { imei: identifier },
            { androidId: identifier }
          ]
        },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Device locked: ${identifier}`);
        return await this.getDevice(identifier);
      }
      
      return null;
    } catch (error) {
      logger.error('Error locking device:', error);
      throw error;
    }
  }

  async unlockDevice(identifier) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const updateData = {
        isLocked: false,
        status: 'active',
        lastUnlockTime: new Date(),
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        {
          $or: [
            { imei: identifier },
            { androidId: identifier }
          ]
        },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Device unlocked: ${identifier}`);
        return await this.getDevice(identifier);
      }
      
      return null;
    } catch (error) {
      logger.error('Error unlocking device:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const devices = await collection.find({}).toArray();
      return devices;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async getDevicesByStatus(status) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const devices = await collection.find({ status: status }).toArray();
      return devices;
    } catch (error) {
      logger.error('Error getting devices by status:', error);
      throw error;
    }
  }

  async deleteDevice(identifier) {
    try {
      const db = await this.connect();
      const collection = db.collection('devices');
      
      const result = await collection.deleteOne({
        $or: [
          { imei: identifier },
          { androidId: identifier }
        ]
      });

      if (result.deletedCount > 0) {
        logger.info(`Device deleted: ${identifier}`);
        return { success: true, message: 'Device deleted successfully' };
      }
      
      return { success: false, message: 'Device not found' };
    } catch (error) {
      logger.error('Error deleting device:', error);
      throw error;
    }
  }
}

// Create singleton instance
const mongoDBService = new MongoDBService();

module.exports = mongoDBService;
