import { logger } from '../config/logger.js';

export interface DeviceRecord {
  id?: number;
  imei: string;
  serialNumber?: string;
  deviceId?: string;
  androidId?: string;
  macAddress?: string;
  deviceName?: string;
  model?: string;
  manufacturer?: string;
  osVersion?: string;
  isLocked: boolean;
  lastLockTime?: string;
  lastUnlockTime?: string;
  registeredAt: string;
  lastSeen?: string;
  status: 'active' | 'inactive' | 'locked' | 'offline';
  customData?: Record<string, any>;
}

// In-memory database for demo purposes
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)
class DeviceDatabase {
  private devices: Map<string, DeviceRecord> = new Map();
  private nextId = 1;

  async registerDevice(deviceData: Omit<DeviceRecord, 'id' | 'registeredAt' | 'isLocked' | 'status'>): Promise<DeviceRecord> {
    try {
      const device: DeviceRecord = {
        id: this.nextId++,
        ...deviceData,
        isLocked: false,
        registeredAt: new Date().toISOString(),
        status: 'active',
        lastSeen: new Date().toISOString(),
      };

      this.devices.set(device.imei, device);
      
      logger.info(`Device registered: IMEI ${device.imei}`, { deviceId: device.id });
      
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async getDevice(imei: string): Promise<DeviceRecord | null> {
    return this.devices.get(imei) || null;
  }

  async updateDeviceStatus(imei: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const device = this.devices.get(imei);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      ...updates,
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(imei, updatedDevice);
    
    logger.info(`Device updated: IMEI ${imei}`, { updates });
    
    return updatedDevice;
  }

  async lockDevice(imei: string): Promise<DeviceRecord | null> {
    const device = this.devices.get(imei);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      isLocked: true,
      lastLockTime: new Date().toISOString(),
      status: 'locked' as const,
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(imei, updatedDevice);
    
    logger.info(`Device locked: IMEI ${imei}`);
    
    return updatedDevice;
  }

  async unlockDevice(imei: string): Promise<DeviceRecord | null> {
    const device = this.devices.get(imei);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      isLocked: false,
      lastUnlockTime: new Date().toISOString(),
      status: 'active' as const,
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(imei, updatedDevice);
    
    logger.info(`Device unlocked: IMEI ${imei}`);
    
    return updatedDevice;
  }

  async getAllDevices(): Promise<DeviceRecord[]> {
    return Array.from(this.devices.values());
  }

  async getDevicesByStatus(status: DeviceRecord['status']): Promise<DeviceRecord[]> {
    return Array.from(this.devices.values()).filter(device => device.status === status);
  }

  async deleteDevice(imei: string): Promise<boolean> {
    const existed = this.devices.has(imei);
    this.devices.delete(imei);
    
    if (existed) {
      logger.info(`Device deleted: IMEI ${imei}`);
    }
    
    return existed;
  }
}

// Singleton instance
const deviceDatabase = new DeviceDatabase();

export class DeviceDatabaseService {
  static async registerDevice(deviceData: Omit<DeviceRecord, 'id' | 'registeredAt' | 'isLocked' | 'status'>): Promise<ApiResponse<DeviceRecord>> {
    try {
      // Check if device already exists
      const existingDevice = await deviceDatabase.getDevice(deviceData.imei);
      if (existingDevice) {
        return {
          success: false,
          error: 'Device with this IMEI already exists',
          data: existingDevice,
        };
      }

      const device = await deviceDatabase.registerDevice(deviceData);
      
      return {
        success: true,
        data: device,
        message: 'Device registered successfully',
      };
    } catch (error) {
      logger.error('Error in registerDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getDevice(imei: string): Promise<ApiResponse<DeviceRecord>> {
    try {
      const device = await deviceDatabase.getDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device found',
      };
    } catch (error) {
      logger.error('Error in getDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async lockDevice(imei: string): Promise<ApiResponse<DeviceRecord>> {
    try {
      const device = await deviceDatabase.lockDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device locked successfully',
      };
    } catch (error) {
      logger.error('Error in lockDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async unlockDevice(imei: string): Promise<ApiResponse<DeviceRecord>> {
    try {
      const device = await deviceDatabase.unlockDevice(imei);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device unlocked successfully',
      };
    } catch (error) {
      logger.error('Error in unlockDevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getAllDevices(): Promise<ApiResponse<DeviceRecord[]>> {
    try {
      const devices = await deviceDatabase.getAllDevices();
      
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} devices`,
      };
    } catch (error) {
      logger.error('Error in getAllDevices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getDevicesByStatus(status: DeviceRecord['status']): Promise<ApiResponse<DeviceRecord[]>> {
    try {
      const devices = await deviceDatabase.getDevicesByStatus(status);
      
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} devices with status: ${status}`,
      };
    } catch (error) {
      logger.error('Error in getDevicesByStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async updateDeviceStatus(imei: string, updates: Partial<DeviceRecord>): Promise<ApiResponse<DeviceRecord>> {
    try {
      const device = await deviceDatabase.updateDeviceStatus(imei, updates);
      
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
        };
      }

      return {
        success: true,
        data: device,
        message: 'Device status updated successfully',
      };
    } catch (error) {
      logger.error('Error in updateDeviceStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Re-export types
export type { DeviceRecord };
