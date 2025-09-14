### CREATE POLICY
curl -X POST https://poetic-llama-889a15.netlify.app/api/devices/policies \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "test_policy",
    "displayName": "Test Policy",
    "description": "A test policy created via API",
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
      "ensureVerifyApps": true
    }
  }'