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
    
    # Minimal policy update - just add password requirements for locking
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
        "passwordMinimumLength": 4
      }
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
        
        print("\n🔒 Added password policy for device locking")
        print("⚠️  Device may need to be rebooted for changes to take effect")
        
    except Exception as e:
        print(f"❌ Error updating policy: {e}")

if __name__ == "__main__":
    update_policy()














