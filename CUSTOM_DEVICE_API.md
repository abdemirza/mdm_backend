# Custom Device Management API

This API provides custom device registration and lock management functionality, separate from Android Enterprise. It maintains its own database of devices and their lock status.

## Base URL
```
https://poetic-llama-889a15.netlify.app/api/custom-devices
```

## Authentication
Currently no authentication is required. In production, implement proper API key or JWT authentication.

## Endpoints

### 1. Register Device
**POST** `/register`

Register a new device in the custom database.

#### Request Body
```json
{
  "imei": "123456789012345",           // Required: 15-digit IMEI
  "serialNumber": "SN123456789",       // Optional: Device serial number
  "deviceId": "device_001",            // Optional: Custom device ID
  "androidId": "android_12345",        // Optional: Android device ID
  "macAddress": "00:11:22:33:44:55",   // Optional: MAC address
  "deviceName": "Test Device",         // Optional: Human-readable name
  "model": "Pixel 6",                  // Optional: Device model
  "manufacturer": "Google",            // Optional: Device manufacturer
  "osVersion": "Android 13",           // Optional: OS version
  "customData": {                      // Optional: Custom metadata
    "location": "Office",
    "department": "IT"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "123456789012345",
    "serialNumber": "SN123456789",
    "deviceId": "device_001",
    "androidId": "android_12345",
    "macAddress": "00:11:22:33:44:55",
    "deviceName": "Test Device",
    "model": "Pixel 6",
    "manufacturer": "Google",
    "osVersion": "Android 13",
    "isLocked": false,
    "registeredAt": "2024-01-01T12:00:00.000Z",
    "status": "active",
    "lastSeen": "2024-01-01T12:00:00.000Z",
    "customData": {
      "location": "Office",
      "department": "IT"
    }
  },
  "message": "Device registered successfully"
}
```

### 2. Lock Device
**POST** `/lock`

Lock a device and update its status in the database.

#### Request Body
```json
{
  "imei": "123456789012345"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "123456789012345",
    "isLocked": true,
    "lastLockTime": "2024-01-01T12:05:00.000Z",
    "status": "locked",
    "lastSeen": "2024-01-01T12:05:00.000Z"
  },
  "message": "Device locked successfully"
}
```

### 3. Unlock Device
**POST** `/unlock`

Unlock a device and update its status in the database.

#### Request Body
```json
{
  "imei": "123456789012345"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "123456789012345",
    "isLocked": false,
    "lastUnlockTime": "2024-01-01T12:10:00.000Z",
    "status": "active",
    "lastSeen": "2024-01-01T12:10:00.000Z"
  },
  "message": "Device unlocked successfully"
}
```

### 4. Get All Devices
**GET** `/`

Retrieve all registered devices.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "imei": "123456789012345",
      "deviceName": "Test Device",
      "isLocked": false,
      "status": "active",
      "registeredAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "message": "Found 1 devices"
}
```

### 5. Get Device by IMEI
**GET** `/device/{imei}`

Retrieve a specific device by IMEI.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "123456789012345",
    "deviceName": "Test Device",
    "isLocked": false,
    "status": "active",
    "registeredAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Device found"
}
```

### 6. Get Devices by Status
**GET** `/status/{status}`

Retrieve devices filtered by status.

#### Status Values
- `active` - Device is active and unlocked
- `locked` - Device is locked
- `inactive` - Device is inactive
- `offline` - Device is offline

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "imei": "123456789012345",
      "deviceName": "Test Device",
      "isLocked": true,
      "status": "locked",
      "lastLockTime": "2024-01-01T12:05:00.000Z"
    }
  ],
  "message": "Found 1 devices with status: locked"
}
```

### 7. Update Device Status
**POST** `/update-status`

Update device information and status.

#### Request Body
```json
{
  "imei": "123456789012345",
  "deviceName": "Updated Device Name",
  "status": "active",
  "customData": {
    "location": "Home",
    "department": "IT",
    "lastUpdate": "2024-01-01T12:15:00.000Z"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "123456789012345",
    "deviceName": "Updated Device Name",
    "status": "active",
    "lastSeen": "2024-01-01T12:15:00.000Z",
    "customData": {
      "location": "Home",
      "department": "IT",
      "lastUpdate": "2024-01-01T12:15:00.000Z"
    }
  },
  "message": "Device status updated successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "IMEI is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Device not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message details"
}
```

## Usage Examples

### cURL Examples

#### Register Device
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/custom-devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "imei": "123456789012345",
    "deviceName": "My Test Device",
    "model": "Pixel 6",
    "manufacturer": "Google"
  }'
```

#### Lock Device
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/custom-devices/lock \
  -H "Content-Type: application/json" \
  -d '{"imei": "123456789012345"}'
```

#### Get All Devices
```bash
curl https://poetic-llama-889a15.netlify.app/api/custom-devices
```

### JavaScript Examples

#### Register Device
```javascript
const response = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imei: '123456789012345',
    deviceName: 'My Test Device',
    model: 'Pixel 6',
    manufacturer: 'Google'
  })
});

const result = await response.json();
console.log(result);
```

#### Lock Device
```javascript
const response = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices/lock', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imei: '123456789012345'
  })
});

const result = await response.json();
console.log(result);
```

## Testing

Run the test suite:
```bash
node test-custom-devices.cjs
```

## Database Schema

The API uses an in-memory database with the following device record structure:

```typescript
interface DeviceRecord {
  id?: number;                    // Auto-generated ID
  imei: string;                   // 15-digit IMEI (primary key)
  serialNumber?: string;          // Device serial number
  deviceId?: string;              // Custom device ID
  androidId?: string;             // Android device ID
  macAddress?: string;            // MAC address
  deviceName?: string;            // Human-readable name
  model?: string;                 // Device model
  manufacturer?: string;          // Device manufacturer
  osVersion?: string;             // OS version
  isLocked: boolean;              // Lock status
  lastLockTime?: string;          // Last lock timestamp
  lastUnlockTime?: string;        // Last unlock timestamp
  registeredAt: string;           // Registration timestamp
  lastSeen?: string;              // Last activity timestamp
  status: 'active' | 'inactive' | 'locked' | 'offline';  // Device status
  customData?: Record<string, any>; // Custom metadata
}
```

## Production Considerations

1. **Database**: Replace in-memory storage with persistent database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Implement API key or JWT authentication
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Validation**: Enhanced input validation and sanitization
5. **Logging**: Comprehensive logging and monitoring
6. **Backup**: Regular database backups
7. **Security**: HTTPS only, input sanitization, SQL injection prevention
