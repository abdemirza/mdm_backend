# FCM (Firebase Cloud Messaging) API

This API provides endpoints for sending real-time commands to devices via Firebase Cloud Messaging. This allows for instant device locking, unlocking, and custom commands without requiring devices to poll the server.

## Base URL
```
https://poetic-llama-889a15.netlify.app/api/fcm
```

## Prerequisites

1. **Firebase Service Account**: Set the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable in Netlify
2. **Firebase Project ID**: Set the `FIREBASE_PROJECT_ID` environment variable in Netlify
3. **Device Registration**: Devices must be registered with FCM tokens
4. **FCM Client**: Device app must be configured to receive FCM messages

## Endpoints

### 1. Update FCM Token
**POST** `/update-token`

Update or register FCM token for a device.

#### Request Body
```json
{
  "imei": "111111111111112",
  "androidId": "189ee9adae9edcb7",
  "fcmToken": "dGVzdF9mY21fdG9rZW5fZm9yX3Rlc3RpbmdfcHVycG9zZXNfb25seQ"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "imei": "111111111111112",
    "androidId": "189ee9adae9edcb7",
    "deviceName": "Test Device",
    "fcmToken": "dGVzdF9mY21fdG9rZW5fZm9yX3Rlc3RpbmdfcHVycG9zZXNfb25seQ",
    "isLocked": false,
    "status": "active",
    "registeredAt": "2024-01-01T12:00:00.000Z",
    "lastSeen": "2024-01-01T12:00:00.000Z"
  },
  "message": "FCM token updated successfully"
}
```

### 2. Send Lock Command
**POST** `/lock`

Send a lock command to a device via FCM.

#### Request Body
```json
{
  "imei": "111111111111112",
  "androidId": "189ee9adae9edcb7"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "device": {
      "id": 1,
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device",
      "isLocked": true,
      "status": "locked",
      "lastLockTime": "2024-01-01T12:05:00.000Z"
    },
    "fcmResult": {
      "success": true,
      "messageId": "0:1234567890123456%abc123def456",
      "successCount": 1,
      "failureCount": 0
    }
  },
  "message": "Lock command sent successfully via FCM"
}
```

### 3. Send Unlock Command
**POST** `/unlock`

Send an unlock command to a device via FCM.

#### Request Body
```json
{
  "imei": "111111111111112",
  "androidId": "189ee9adae9edcb7"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "device": {
      "id": 1,
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device",
      "isLocked": false,
      "status": "active",
      "lastUnlockTime": "2024-01-01T12:10:00.000Z"
    },
    "fcmResult": {
      "success": true,
      "messageId": "0:1234567890123456%abc123def456",
      "successCount": 1,
      "failureCount": 0
    }
  },
  "message": "Unlock command sent successfully via FCM"
}
```

### 4. Send Custom Command
**POST** `/custom-command`

Send a custom command to a device via FCM.

#### Request Body
```json
{
  "imei": "111111111111112",
  "androidId": "189ee9adae9edcb7",
  "command": "CUSTOM_ACTION",
  "title": "Custom Command",
  "body": "This is a custom command sent via FCM",
  "data": {
    "action": "custom_action",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "device": {
      "id": 1,
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device"
    },
    "fcmResult": {
      "success": true,
      "messageId": "0:1234567890123456%abc123def456",
      "successCount": 1,
      "failureCount": 0
    }
  },
  "message": "Custom command sent successfully via FCM"
}
```

## FCM Message Format

### Lock Command
```json
{
  "notification": {
    "title": "Device Lock Command",
    "body": "Your device has been locked by the administrator",
    "sound": "default",
    "badge": 1
  },
  "data": {
    "command": "LOCK_DEVICE",
    "action": "lock",
    "deviceInfo": {
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device",
      "model": "Pixel 6"
    },
    "timestamp": "2024-01-01T12:05:00.000Z"
  },
  "priority": "high",
  "time_to_live": 3600
}
```

### Unlock Command
```json
{
  "notification": {
    "title": "Device Unlock Command",
    "body": "Your device has been unlocked by the administrator",
    "sound": "default",
    "badge": 1
  },
  "data": {
    "command": "UNLOCK_DEVICE",
    "action": "unlock",
    "deviceInfo": {
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device",
      "model": "Pixel 6"
    },
    "timestamp": "2024-01-01T12:10:00.000Z"
  },
  "priority": "high",
  "time_to_live": 3600
}
```

### Wipe Command
```json
{
  "notification": {
    "title": "Device Wipe Command",
    "body": "Your device will be wiped by the administrator",
    "sound": "default",
    "badge": 1
  },
  "data": {
    "command": "WIPE_DEVICE",
    "action": "wipe",
    "deviceInfo": {
      "imei": "111111111111112",
      "androidId": "189ee9adae9edcb7",
      "deviceName": "Test Device",
      "model": "Pixel 6"
    },
    "timestamp": "2024-01-01T12:15:00.000Z"
  },
  "priority": "high",
  "time_to_live": 3600
}
```

## Usage Examples

### cURL Examples

#### Update FCM Token
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/update-token \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "189ee9adae9edcb7",
    "fcmToken": "dGVzdF9mY21fdG9rZW5fZm9yX3Rlc3RpbmdfcHVycG9zZXNfb25seQ"
  }'
```

#### Send Lock Command
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/lock \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "189ee9adae9edcb7"
  }'
```

#### Send Unlock Command
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/unlock \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "189ee9adae9edcb7"
  }'
```

#### Send Custom Command
```bash
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/custom-command \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "189ee9adae9edcb7",
    "command": "CUSTOM_ACTION",
    "title": "Custom Command",
    "body": "This is a custom command sent via FCM",
    "data": {
      "action": "custom_action",
      "parameters": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  }'
```

### JavaScript Examples

#### Update FCM Token
```javascript
const response = await fetch('https://poetic-llama-889a15.netlify.app/api/fcm/update-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    androidId: '189ee9adae9edcb7',
    fcmToken: 'dGVzdF9mY21fdG9rZW5fZm9yX3Rlc3RpbmdfcHVycG9zZXNfb25seQ'
  })
});

const result = await response.json();
console.log(result);
```

#### Send Lock Command
```javascript
const response = await fetch('https://poetic-llama-889a15.netlify.app/api/fcm/lock', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    androidId: '189ee9adae9edcb7'
  })
});

const result = await response.json();
console.log(result);
```

## Android Client Implementation

### 1. Add FCM Dependencies
```gradle
// app/build.gradle
implementation 'com.google.firebase:firebase-messaging:23.0.0'
implementation 'com.google.firebase:firebase-analytics:21.0.0'
```

### 2. Create FCM Service
```java
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        // Handle notification
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            
            // Show notification
            showNotification(title, body);
        }
        
        // Handle data payload
        if (remoteMessage.getData().size() > 0) {
            String command = remoteMessage.getData().get("command");
            String action = remoteMessage.getData().get("action");
            
            switch (command) {
                case "LOCK_DEVICE":
                    handleLockCommand();
                    break;
                case "UNLOCK_DEVICE":
                    handleUnlockCommand();
                    break;
                case "WIPE_DEVICE":
                    handleWipeCommand();
                    break;
                default:
                    handleCustomCommand(command, remoteMessage.getData());
                    break;
            }
        }
    }
    
    private void handleLockCommand() {
        // Implement device locking logic
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        if (dpm.isAdminActive(new ComponentName(this, DeviceAdminReceiver.class))) {
            dpm.lockNow();
        }
    }
    
    private void handleUnlockCommand() {
        // Implement device unlocking logic
        // Note: Unlocking via FCM is not directly possible
        // You might need to show a prompt or use other methods
    }
    
    private void handleWipeCommand() {
        // Implement device wiping logic
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        if (dpm.isAdminActive(new ComponentName(this, DeviceAdminReceiver.class))) {
            dpm.wipeData(0);
        }
    }
    
    private void handleCustomCommand(String command, Map<String, String> data) {
        // Handle custom commands
        Log.d("FCM", "Custom command received: " + command);
    }
}
```

### 3. Register FCM Token
```java
FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(new OnCompleteListener<String>() {
        @Override
        public void onComplete(@NonNull Task<String> task) {
            if (!task.isSuccessful()) {
                Log.w("FCM", "Fetching FCM registration token failed", task.getException());
                return;
            }

            // Get new FCM registration token
            String token = task.getResult();
            Log.d("FCM", "FCM Registration Token: " + token);
            
            // Send token to server
            sendTokenToServer(token);
        }
    });

private void sendTokenToServer(String token) {
    // Send token to your MDM backend
    // POST /api/fcm/update-token
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "FCM token is required"
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

## Testing

Run the test suite:
```bash
node test-fcm.cjs
```

## Environment Variables

Set the following environment variables in Netlify:

- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON key (as a string)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

### Setting up Firebase Service Account

1. **Go to Firebase Console**: Navigate to your Firebase project
2. **Project Settings**: Click the gear icon next to "Project Overview"
3. **Service Accounts Tab**: Click on "Service accounts" tab
4. **Generate New Private Key**: Click "Generate new private key"
5. **Download JSON**: Save the downloaded JSON file securely
6. **Set Environment Variable**: Copy the entire JSON content and set it as `FIREBASE_SERVICE_ACCOUNT_KEY` in Netlify

**Important Security Notes:**
- Never commit the service account JSON to version control
- Store it securely in environment variables only
- The JSON contains private key information
- Rotate keys regularly for security

## Notes

- FCM messages have a time-to-live of 1 hour
- Commands are sent with high priority for immediate delivery
- Device must be online to receive FCM messages
- FCM tokens can change, so they should be updated regularly
- The API automatically updates device status in the database when commands are sent



