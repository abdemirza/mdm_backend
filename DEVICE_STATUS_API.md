# Device Status API

This API provides endpoints for retrieving device status information by IMEI number. It searches both Android Enterprise devices and the custom device database to provide comprehensive device status information.

## Base URL
```
https://poetic-llama-889a15.netlify.app/api/device-status
```

## Endpoints

### 1. Get Device Status by IMEI
**GET** `/imei/{imei}`

Retrieve comprehensive device status information by IMEI number.

#### Parameters
- `imei` (string, required) - 15-digit IMEI number

#### Response - Android Enterprise Device
```json
{
  "success": true,
  "data": {
    "imei": "123456789012345",
    "source": "android_enterprise",
    "deviceName": "enterprises/LC048psd8h/devices/device_001",
    "model": "Pixel 6",
    "manufacturer": "Google",
    "osVersion": "13",
    "policyName": "enterprises/LC048psd8h/policies/policy1",
    "state": "ACTIVE",
    "managementMode": "DEVICE_OWNER",
    "appliedState": "ACTIVE",
    "enrollmentTokenName": "enterprises/LC048psd8h/enrollmentTokens/token_001",
    "lastStatusReportTime": "2024-01-01T12:00:00.000Z",
    "lastPolicySyncTime": "2024-01-01T12:00:00.000Z",
    "userName": "user@example.com",
    "hardwareInfo": {
      "serialNumber": "123456789012345",
      "model": "Pixel 6",
      "manufacturer": "Google",
      "brand": "Google",
      "deviceBasebandVersion": "1.0.0",
      "deviceKernelVersion": "5.10.0",
      "deviceBuildNumber": "SP2A.220405.004",
      "deviceBootloaderVersion": "1.0.0",
      "hardware": "Pixel 6",
      "product": "Pixel 6",
      "soc": "Google Tensor",
      "socManufacturer": "Google",
      "wifiMacAddress": "00:11:22:33:44:55",
      "wifiMacAddresses": ["00:11:22:33:44:55"],
      "deviceId": "device_001",
      "androidId": "android_12345"
    },
    "softwareInfo": {
      "androidVersion": "13",
      "androidBuildNumber": "SP2A.220405.004",
      "androidBuildTime": "2024-01-01T00:00:00.000Z",
      "androidBuildFingerprint": "google/pixel_6/pixel_6:13/SP2A.220405.004/123456:user/release-keys",
      "androidBuildSecurityPatchLevel": "2024-01-01",
      "androidDebuggingEnabled": false,
      "androidDevicePolicyVersionCode": 1,
      "androidDevicePolicyVersionName": "1.0.0",
      "androidId": "android_12345",
      "bootMode": "NORMAL",
      "deviceBuildSignature": "signature_hash",
      "deviceKernelVersion": "5.10.0",
      "primaryLanguageCode": "en",
      "regionCode": "US",
      "securityPatchLevel": "2024-01-01",
      "systemUpdateInfo": {
        "updateReceivedTime": "2024-01-01T12:00:00.000Z",
        "updateStatus": "UPDATE_STATUS_UNKNOWN"
      }
    },
    "policyCompliant": true,
    "deviceSettings": {
      "adbEnabled": false,
      "developmentSettingsEnabled": false,
      "encryptionStatus": "ENCRYPTED",
      "isDeviceSecure": true,
      "isEncrypted": true,
      "unknownSourcesEnabled": false,
      "verifyAppsEnabled": true
    },
    "networkInfo": {
      "imei": "123456789012345",
      "meid": "meid_12345",
      "wifiMacAddress": "00:11:22:33:44:55",
      "wifiMacAddresses": ["00:11:22:33:44:55"],
      "networkOperatorName": "Carrier Name",
      "telephonyInfos": [
        {
          "carrierName": "Carrier Name",
          "phoneNumber": "+1234567890",
          "countryCode": "US"
        }
      ]
    },
    "memoryInfo": {
      "totalInternalStorage": 128000000000,
      "totalRam": 8000000000,
      "availableInternalStorage": 64000000000,
      "availableRam": 4000000000
    },
    "appliedPolicyName": "enterprises/LC048psd8h/policies/policy1",
    "appliedPolicyVersion": "1",
    "disabledReason": null,
    "enrollmentTime": "2024-01-01T10:00:00.000Z",
    "lastPolicyComplianceReportTime": "2024-01-01T12:00:00.000Z",
    "memoryEvents": [],
    "networkEvents": [],
    "powerManagementEvents": [],
    "systemProperties": {},
    "userOwners": ["user@example.com"],
    "nonComplianceDetails": []
  },
  "message": "Device status retrieved from Android Enterprise"
}
```

#### Response - Custom Database Device
```json
{
  "success": true,
  "data": {
    "imei": "123456789012345",
    "source": "custom_database",
    "deviceName": "Test Device",
    "model": "Pixel 6",
    "manufacturer": "Google",
    "osVersion": "Android 13",
    "isLocked": false,
    "status": "active",
    "registeredAt": "2024-01-01T12:00:00.000Z",
    "lastSeen": "2024-01-01T12:00:00.000Z",
    "lastLockTime": null,
    "lastUnlockTime": "2024-01-01T11:00:00.000Z",
    "serialNumber": "SN123456789",
    "deviceId": "device_001",
    "androidId": "android_12345",
    "macAddress": "00:11:22:33:44:55",
    "customData": {
      "location": "Office",
      "department": "IT"
    }
  },
  "message": "Device status retrieved from custom database"
}
```

#### Response - Device Not Found
```json
{
  "success": false,
  "error": "Device not found",
  "data": {
    "imei": "999999999999999",
    "source": "not_found",
    "message": "Device not found in Android Enterprise or custom database. Please verify the IMEI number."
  }
}
```

## Usage Examples

### cURL Examples

#### Get Device Status by IMEI
```bash
curl https://poetic-llama-889a15.netlify.app/api/device-status/imei/123456789012345
```

#### Test with Invalid IMEI
```bash
curl https://poetic-llama-889a15.netlify.app/api/device-status/imei/123
```

### JavaScript Examples

#### Get Device Status
```javascript
const imei = '123456789012345';
const response = await fetch(`https://poetic-llama-889a15.netlify.app/api/device-status/imei/${imei}`);
const result = await response.json();

if (result.success) {
  console.log('Device found:', result.data);
  console.log('Source:', result.data.source);
  console.log('Device Name:', result.data.deviceName);
  console.log('Status:', result.data.status || result.data.state);
} else {
  console.log('Device not found:', result.error);
}
```

#### Handle Different Sources
```javascript
async function getDeviceStatus(imei) {
  const response = await fetch(`https://poetic-llama-889a15.netlify.app/api/device-status/imei/${imei}`);
  const result = await response.json();
  
  if (result.success) {
    const device = result.data;
    
    switch (device.source) {
      case 'android_enterprise':
        console.log('Android Enterprise Device:');
        console.log('- State:', device.state);
        console.log('- Management Mode:', device.managementMode);
        console.log('- Policy Compliant:', device.policyCompliant);
        console.log('- Last Status Report:', device.lastStatusReportTime);
        break;
        
      case 'custom_database':
        console.log('Custom Database Device:');
        console.log('- Status:', device.status);
        console.log('- Is Locked:', device.isLocked);
        console.log('- Last Seen:', device.lastSeen);
        console.log('- Registered At:', device.registeredAt);
        break;
        
      default:
        console.log('Unknown source:', device.source);
    }
  } else {
    console.log('Device not found:', result.error);
  }
}
```

## Error Responses

### 400 Bad Request - Invalid IMEI Format
```json
{
  "success": false,
  "error": "Invalid IMEI format. IMEI must be 15 digits."
}
```

### 404 Not Found - Device Not Found
```json
{
  "success": false,
  "error": "Device not found",
  "data": {
    "imei": "999999999999999",
    "source": "not_found",
    "message": "Device not found in Android Enterprise or custom database. Please verify the IMEI number."
  }
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

## Data Sources

The API searches for devices in the following order:

1. **Android Enterprise** - Searches enrolled devices by IMEI (serial number)
2. **Custom Database** - Searches custom device registry by IMEI
3. **Not Found** - Returns error if device is not found in either source

## Device Status Fields

### Android Enterprise Devices
- `source`: "android_enterprise"
- `state`: Device state (ACTIVE, DISABLED, etc.)
- `managementMode`: Management mode (DEVICE_OWNER, PROFILE_OWNER, etc.)
- `policyCompliant`: Whether device complies with assigned policy
- `lastStatusReportTime`: Last time device reported status
- `enrollmentTime`: When device was enrolled
- `hardwareInfo`: Detailed hardware information
- `softwareInfo`: Detailed software information
- `networkInfo`: Network and connectivity information
- `memoryInfo`: Memory and storage information

### Custom Database Devices
- `source`: "custom_database"
- `status`: Device status (active, locked, inactive, offline)
- `isLocked`: Whether device is currently locked
- `lastSeen`: Last time device was seen
- `registeredAt`: When device was registered
- `lastLockTime`: Last time device was locked
- `lastUnlockTime`: Last time device was unlocked
- `customData`: Custom metadata

## Testing

Run the test suite:
```bash
node test-device-status.cjs
```

## Notes

- IMEI must be exactly 15 digits
- The API searches both Android Enterprise and custom database
- Android Enterprise devices provide more detailed information
- Custom database devices provide lock status and custom metadata
- Device not found errors include helpful messages for troubleshooting
