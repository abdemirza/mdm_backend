# Policy Management API

This API provides endpoints for managing Android Enterprise policies, including listing existing policies and creating new ones.

## Base URL
```
https://poetic-llama-889a15.netlify.app/api/devices
```

## Endpoints

### 1. List All Policies
**GET** `/policies`

Retrieve all policies for the enterprise.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "name": "enterprises/LC048psd8h/policies/policy1",
      "displayName": "Policy 1",
      "description": "Default policy for devices",
      "cameraDisabled": false,
      "bluetoothConfigDisabled": false,
      "wifiConfigDisabled": false,
      "usbFileTransferDisabled": false,
      "installAppsDisabled": false,
      "uninstallAppsDisabled": false,
      "playStoreMode": "PLAY_STORE_MODE_ALLOWLIST",
      "safeBootDisabled": false,
      "screenCaptureDisabled": false,
      "locationMode": "LOCATION_MODE_DISABLED"
    }
  ],
  "message": "Found 1 policies"
}
```

### 2. Create New Policy
**POST** `/policies`

Create a new policy for the enterprise.

#### Request Body
```json
{
  "policyId": "custom_policy_001",
  "displayName": "Custom Policy",
  "description": "A custom policy created via API",
  "settings": {
    "cameraDisabled": true,
    "bluetoothConfigDisabled": false,
    "wifiConfigDisabled": false,
    "usbFileTransferDisabled": true,
    "installAppsDisabled": false,
    "uninstallAppsDisabled": true,
    "playStoreMode": "PLAY_STORE_MODE_ALLOWLIST",
    "screenCaptureDisabled": false,
    "locationMode": "LOCATION_MODE_DISABLED",
    "safeBootDisabled": true,
    "factoryResetDisabled": true,
    "ensureVerifyApps": true,
    "passwordPolicies": {
      "passwordScope": "SCOPE_DEVICE",
      "passwordQuality": "PASSWORD_QUALITY_ALPHANUMERIC",
      "passwordMinimumLength": 8,
      "passwordMinimumLetters": 1,
      "passwordMinimumLowerCase": 1,
      "passwordMinimumUpperCase": 1,
      "passwordMinimumNumeric": 1,
      "passwordMinimumSymbols": 1,
      "passwordMinimumNonLetter": 1,
      "maximumFailedPasswordsForWipe": 5,
      "passwordExpirationTimeout": "7776000000000",
      "passwordHistoryLength": 3
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "name": "enterprises/LC048psd8h/policies/custom_policy_001",
    "displayName": "Custom Policy",
    "description": "A custom policy created via API",
    "cameraDisabled": true,
    "bluetoothConfigDisabled": false,
    "wifiConfigDisabled": false,
    "usbFileTransferDisabled": true,
    "installAppsDisabled": false,
    "uninstallAppsDisabled": true,
    "playStoreMode": "PLAY_STORE_MODE_ALLOWLIST",
    "screenCaptureDisabled": false,
    "locationMode": "LOCATION_MODE_DISABLED",
    "safeBootDisabled": true,
    "factoryResetDisabled": true,
    "ensureVerifyApps": true
  },
  "message": "Policy created successfully"
}
```

## Policy Settings Reference

### Basic Security Settings
- `cameraDisabled` - Disable camera access
- `bluetoothConfigDisabled` - Disable Bluetooth configuration
- `wifiConfigDisabled` - Disable WiFi configuration
- `usbFileTransferDisabled` - Disable USB file transfer
- `installAppsDisabled` - Disable app installation
- `uninstallAppsDisabled` - Disable app uninstallation
- `screenCaptureDisabled` - Disable screen capture
- `safeBootDisabled` - Disable safe boot
- `factoryResetDisabled` - Disable factory reset
- `ensureVerifyApps` - Enable app verification

### Play Store Settings
- `playStoreMode` - Play Store access mode
  - `PLAY_STORE_MODE_ALLOWLIST` - Only allowlisted apps
  - `PLAY_STORE_MODE_BLOCKLIST` - Block specific apps
  - `PLAY_STORE_MODE_DISABLED` - Disable Play Store

### Location Settings
- `locationMode` - Location access mode
  - `LOCATION_MODE_DISABLED` - Disable location
  - `LOCATION_MODE_ENABLED` - Enable location
  - `LOCATION_MODE_ENFORCED` - Enforce location

### Password Policies
```json
{
  "passwordPolicies": {
    "passwordScope": "SCOPE_DEVICE",
    "passwordQuality": "PASSWORD_QUALITY_ALPHANUMERIC",
    "passwordMinimumLength": 8,
    "passwordMinimumLetters": 1,
    "passwordMinimumLowerCase": 1,
    "passwordMinimumUpperCase": 1,
    "passwordMinimumNumeric": 1,
    "passwordMinimumSymbols": 1,
    "passwordMinimumNonLetter": 1,
    "maximumFailedPasswordsForWipe": 5,
    "passwordExpirationTimeout": "7776000000000",
    "passwordHistoryLength": 3
  }
}
```

### Password Quality Options
- `PASSWORD_QUALITY_UNSPECIFIED` - No password requirements
- `PASSWORD_QUALITY_SOMETHING` - Something (not secure)
- `PASSWORD_QUALITY_NUMERIC` - Numeric only
- `PASSWORD_QUALITY_ALPHABETIC` - Alphabetic only
- `PASSWORD_QUALITY_ALPHANUMERIC` - Alphanumeric
- `PASSWORD_QUALITY_COMPLEX` - Complex (letters, numbers, symbols)

### User Management Settings
- `modifyAccountsDisabled` - Disable account modification
- `addUserDisabled` - Disable adding users
- `removeUserDisabled` - Disable removing users
- `setUserRestrictionsDisabled` - Disable user restrictions
- `setGlobalProxyDisabled` - Disable global proxy
- `setAlwaysOnVpnDisabled` - Disable always-on VPN
- `setPermittedAccessibilityServicesDisabled` - Disable accessibility services
- `setPermittedInputMethodsDisabled` - Disable input methods
- `setPermittedCrossProfileNotificationListenersDisabled` - Disable cross-profile notifications
- `setPermittedCrossProfileCallerIdDisabled` - Disable cross-profile caller ID
- `setPermittedCrossProfileContactsDisabled` - Disable cross-profile contacts

## Usage Examples

### cURL Examples

#### List All Policies
```bash
curl https://poetic-llama-889a15.netlify.app/api/devices/policies
```

#### Create Basic Policy
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/devices/policies \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "basic_policy",
    "displayName": "Basic Security Policy",
    "description": "Basic security settings for devices",
    "settings": {
      "cameraDisabled": false,
      "bluetoothConfigDisabled": false,
      "wifiConfigDisabled": false,
      "usbFileTransferDisabled": true,
      "installAppsDisabled": false,
      "uninstallAppsDisabled": true,
      "playStoreMode": "PLAY_STORE_MODE_ALLOWLIST",
      "screenCaptureDisabled": false,
      "locationMode": "LOCATION_MODE_DISABLED",
      "safeBootDisabled": true,
      "factoryResetDisabled": true,
      "ensureVerifyApps": true
    }
  }'
```

#### Create Restrictive Policy
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/devices/policies \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "restrictive_policy",
    "displayName": "Restrictive Security Policy",
    "description": "Maximum security settings for sensitive devices",
    "settings": {
      "cameraDisabled": true,
      "bluetoothConfigDisabled": true,
      "wifiConfigDisabled": true,
      "usbFileTransferDisabled": true,
      "installAppsDisabled": true,
      "uninstallAppsDisabled": true,
      "playStoreMode": "PLAY_STORE_MODE_DISABLED",
      "screenCaptureDisabled": true,
      "locationMode": "LOCATION_MODE_DISABLED",
      "safeBootDisabled": true,
      "factoryResetDisabled": true,
      "ensureVerifyApps": true,
      "modifyAccountsDisabled": true,
      "addUserDisabled": true,
      "removeUserDisabled": true
    }
  }'
```

### JavaScript Examples

#### List All Policies
```javascript
const response = await fetch('https://poetic-llama-889a15.netlify.app/api/devices/policies');
const result = await response.json();
console.log(result);
```

#### Create Policy
```javascript
const policyData = {
  policyId: 'custom_policy',
  displayName: 'Custom Policy',
  description: 'A custom policy created via API',
  settings: {
    cameraDisabled: true,
    bluetoothConfigDisabled: false,
    wifiConfigDisabled: false,
    usbFileTransferDisabled: true,
    installAppsDisabled: false,
    uninstallAppsDisabled: true,
    playStoreMode: 'PLAY_STORE_MODE_ALLOWLIST',
    screenCaptureDisabled: false,
    locationMode: 'LOCATION_MODE_DISABLED',
    safeBootDisabled: true,
    factoryResetDisabled: true,
    ensureVerifyApps: true
  }
};

const response = await fetch('https://poetic-llama-889a15.netlify.app/api/devices/policies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(policyData)
});

const result = await response.json();
console.log(result);
```

## Testing

Run the test suite:
```bash
node test-create-policy.cjs
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid policy data"
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

## Notes

- Policy IDs must be unique within the enterprise
- If no `policyId` is provided, a timestamp-based ID will be generated
- Policy settings are merged with default values
- Some policy settings may require specific Android Enterprise permissions
- Policies are applied to devices when they are enrolled or when the policy is updated
