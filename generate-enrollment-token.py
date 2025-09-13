#!/usr/bin/env python3
"""
Generate Android Enterprise enrollment tokens
"""

import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
ENTERPRISE_ID = "LC048psd8h"
POLICY_NAME = f"enterprises/{ENTERPRISE_ID}/policies/policy1"
SERVICE_ACCOUNT_FILE = "mdm_server_key.json"

def create_enrollment_token():
    """Create a new enrollment token for device provisioning"""
    
    try:
        # Authenticate
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/androidmanagement']
        )
        
        # Build the service
        service = build('androidmanagement', 'v1', credentials=credentials)
        
        # Create enrollment token
        enterprise_name = f"enterprises/{ENTERPRISE_ID}"
        
        enrollment_token_request = {
            "policyName": POLICY_NAME,
            "duration": "3600s"  # 1 hour duration
        }
        
        print(f"Creating enrollment token for enterprise: {enterprise_name}")
        print(f"Policy: {POLICY_NAME}")
        
        response = service.enterprises().enrollmentTokens().create(
            parent=enterprise_name,
            body=enrollment_token_request
        ).execute()
        
        print("\n" + "="*60)
        print("ENROLLMENT TOKEN CREATED SUCCESSFULLY")
        print("="*60)
        
        print(f"Token Name: {response['name']}")
        print(f"Token Value: {response['value']}")
        print(f"Expires: {response['expirationTimestamp']}")
        print(f"Policy: {response['policyName']}")
        
        # Extract QR code content
        if 'qrCode' in response:
            qr_content = response['qrCode']
            print(f"\nQR Code Content:")
            print(qr_content)
            
            # Save QR code content to file
            with open('enrollment-qr-content.json', 'w') as f:
                json.dump(json.loads(qr_content), f, indent=2)
            print(f"\nQR Code content saved to: enrollment-qr-content.json")
        
        print("\n" + "="*60)
        print("USAGE INSTRUCTIONS")
        print("="*60)
        print("1. Use this token in your provisioning payload:")
        print(f'   "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "{response["value"]}"')
        print("\n2. Or scan the QR code during device setup")
        print("\n3. Token expires at:", response['expirationTimestamp'])
        print("\n4. Generate a new token if this one expires")
        
        return response
        
    except Exception as e:
        print(f"Error creating enrollment token: {e}")
        return None

def list_existing_tokens():
    """List existing enrollment tokens"""
    
    try:
        # Authenticate
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/androidmanagement']
        )
        
        # Build the service
        service = build('androidmanagement', 'v1', credentials=credentials)
        
        enterprise_name = f"enterprises/{ENTERPRISE_ID}"
        
        print(f"Listing enrollment tokens for: {enterprise_name}")
        
        response = service.enterprises().enrollmentTokens().list(
            parent=enterprise_name
        ).execute()
        
        tokens = response.get('enrollmentTokens', [])
        
        if not tokens:
            print("No enrollment tokens found.")
            return
        
        print(f"\nFound {len(tokens)} enrollment token(s):")
        print("-" * 60)
        
        for token in tokens:
            print(f"Name: {token['name']}")
            print(f"Value: {token['value']}")
            print(f"Expires: {token['expirationTimestamp']}")
            print(f"Policy: {token['policyName']}")
            print("-" * 60)
            
    except Exception as e:
        print(f"Error listing enrollment tokens: {e}")

if __name__ == "__main__":
    print("Android Enterprise Enrollment Token Generator")
    print("=" * 50)
    
    choice = input("\nChoose an option:\n1. Create new token\n2. List existing tokens\nEnter choice (1 or 2): ")
    
    if choice == "1":
        create_enrollment_token()
    elif choice == "2":
        list_existing_tokens()
    else:
        print("Invalid choice. Please run the script again.")
