// Shared Device Database for FCM and Custom Devices
class SharedDeviceDatabase {
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
      
      console.log(`Device registered: IMEI ${device.imei}, AndroidId ${device.androidId}`, { deviceId: device.id });
      
      return device;
    } catch (error) {
      console.error('Error registering device:', error);
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
    
    console.log(`FCM token updated: IMEI ${device.imei}, AndroidId ${device.androidId}`, { fcmToken: fcmToken.substring(0, 20) + '...' });
    
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
    
    console.log(`Device locked: IMEI ${device.imei}, AndroidId ${device.androidId}`);
    
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
    
    console.log(`Device unlocked: IMEI ${device.imei}, AndroidId ${device.androidId}`);
    
    return updatedDevice;
  }

  async getAllDevices() {
    const devices = Array.from(this.devices.values());
    const uniqueDevices = devices.filter((device, index, self) => 
      index === self.findIndex(d => d.id === device.id)
    );
    return uniqueDevices;
  }

  async updateDeviceStatus(identifier, status) {
    const device = this.devices.get(identifier);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      status: status,
      lastSeen: new Date().toISOString(),
    };

    // Update both IMEI and androidId entries
    this.devices.set(device.imei, updatedDevice);
    if (device.androidId) {
      this.devices.set(device.androidId, updatedDevice);
    }
    
    console.log(`Device status updated: IMEI ${device.imei}, AndroidId ${device.androidId}, Status: ${status}`);
    
    return updatedDevice;
  }
}

// Singleton instance
let sharedDatabase = null;

export function getSharedDeviceDatabase() {
  if (!sharedDatabase) {
    sharedDatabase = new SharedDeviceDatabase();
  }
  return sharedDatabase;
}

export { SharedDeviceDatabase };
