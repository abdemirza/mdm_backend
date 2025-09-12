#!/usr/bin/env python3

import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
SERVICE_ACCOUNT_FILE = 'mdm_server_key.json'
SCOPES = ['https://www.googleapis.com/auth/androidmanagement']

# Enterprise and policy details
enterprise_name = 'enterprises/LC048psd8h'
policy_name = enterprise_name + '/policies/policy1'

def update_policy():
    # Authenticate
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    
    androidmanagement = build('androidmanagement', 'v1', credentials=credentials)
    
    # Updated policy with security settings for device locking
    policy_json = '''
    {
      "applications": [
        {
          "packageName": "com.google.samples.apps.iosched",
          "installType": "FORCE_INSTALLED"
        }
      ],
      "advancedSecurityOverrides": {
        "developerSettings": "DEVELOPER_SETTINGS_ALLOWED"
      },
      "passwordPolicies": {
        "passwordScope": "SCOPE_DEVICE",
        "passwordQuality": "NUMERIC",
        "passwordMinimumLength": 4,
        "passwordMinimumLetters": 0,
        "passwordMinimumLowerCase": 0,
        "passwordMinimumUpperCase": 0,
        "passwordMinimumNonLetter": 0,
        "passwordMinimumNumeric": 1,
        "passwordMinimumSymbols": 0,
        "passwordHistoryLength": 0,
        "passwordExpirationTimeout": "0",
        "maximumFailedPasswordsForWipe": 10
      },
      "securityPolicies": {
        "screenCaptureDisabled": false,
        "cameraDisabled": false,
        "keyguardDisabled": false,
        "statusBarDisabled": false,
        "adjustVolumeDisabled": false,
        "installAppsDisabled": false,
        "uninstallAppsDisabled": false,
        "shareLocationDisabled": false,
        "modifyAccountsDisabled": false,
        "usbFileTransferDisabled": false,
        "usbMassStorageEnabled": true,
        "encryptionPolicy": "ENCRYPTION_POLICY_UNSPECIFIED",
        "bluetoothContactSharingDisabled": false,
        "bluetoothConfigDisabled": false,
        "wifiConfigDisabled": false,
        "wifiConfigsLockDownEnabled": false,
        "wifiDirectSettingsLockDownEnabled": false,
        "mobileNetworksConfigDisabled": false,
        "ensureVerifyAppsEnabled": false,
        "vpnConfigDisabled": false,
        "modifyWifiConfigDisabled": false,
        "appAutoUpdatePolicy": "APP_AUTO_UPDATE_POLICY_UNSPECIFIED",
        "wifiConfigsLockDownEnabled": false,
        "wifiDirectSettingsLockDownEnabled": false,
        "bluetoothContactSharingDisabled": false,
        "bluetoothConfigDisabled": false,
        "cameraDisabled": false,
        "keyguardDisabled": false,
        "screenCaptureDisabled": false,
        "statusBarDisabled": false,
        "adjustVolumeDisabled": false,
        "installAppsDisabled": false,
        "uninstallAppsDisabled": false,
        "shareLocationDisabled": false,
        "modifyAccountsDisabled": false,
        "usbFileTransferDisabled": false,
        "usbMassStorageEnabled": true,
        "encryptionPolicy": "ENCRYPTION_POLICY_UNSPECIFIED",
        "ensureVerifyAppsEnabled": false,
        "vpnConfigDisabled": false,
        "modifyWifiConfigDisabled": false,
        "appAutoUpdatePolicy": "APP_AUTO_UPDATE_POLICY_UNSPECIFIED"
      },
      "systemUpdate": {
        "type": "AUTOMATIC"
      },
      "locationMode": "LOCATION_MODE_UNSPECIFIED",
      "defaultPermissionPolicy": "GRANT"
    }
    '''
    
    try:
        print(f"🔄 Updating policy: {policy_name}")
        
        # Update the policy
        result = androidmanagement.enterprises().policies().patch(
            name=policy_name,
            body=json.loads(policy_json)
        ).execute()
        
        print("✅ Policy updated successfully!")
        print("Updated Policy:", json.dumps(result, indent=2))
        
        print("\n🔒 Key security settings added:")
        print("- Password policy with device scope")
        print("- Screen lock requirements")
        print("- Security policies for device management")
        print("- System update policy")
        
        print("\n⚠️  Note: The device may need to be re-enrolled or rebooted")
        print("   for the new policy to take effect.")
        
    except Exception as e:
        print(f"❌ Error updating policy: {e}")

if __name__ == "__main__":
    update_policy()







