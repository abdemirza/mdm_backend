# Firebase Service Account Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) with service account authentication for your MDM backend.

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Create New Project**: Click "Add project" or "Create a project"
3. **Project Name**: Enter your project name (e.g., "ub-mapp-sandbox")
4. **Google Analytics**: Choose whether to enable Google Analytics (optional)
5. **Create Project**: Click "Create project"

## Step 2: Enable Cloud Messaging API

1. **Go to Project Settings**: Click the gear icon next to "Project Overview"
2. **Cloud Messaging Tab**: Click on "Cloud Messaging" tab
3. **Enable API**: If not already enabled, enable the Firebase Cloud Messaging API

## Step 3: Generate Service Account Key

1. **Go to Project Settings**: Click the gear icon next to "Project Overview"
2. **Service Accounts Tab**: Click on "Service accounts" tab
3. **Generate New Private Key**: Click "Generate new private key"
4. **Confirm Generation**: Click "Generate key" in the confirmation dialog
5. **Download JSON**: Your browser will download a JSON file (e.g., `ub-mapp-sandbox-firebase-adminsdk-xxxxx-xxxxxx.json`)

## Step 4: Secure the Service Account Key

**⚠️ CRITICAL SECURITY STEPS:**

1. **Never commit to Git**: Add the JSON file to `.gitignore`
2. **Store securely**: Keep the JSON file in a secure location
3. **Environment variables**: Use environment variables for deployment

## Step 5: Configure Netlify Environment Variables

1. **Go to Netlify Dashboard**: Visit your Netlify site dashboard
2. **Site Settings**: Click on "Site settings"
3. **Environment Variables**: Click on "Environment variables"
4. **Add Variables**: Add the following environment variables:

### Required Environment Variables:

#### `FIREBASE_SERVICE_ACCOUNT_KEY`
- **Value**: Copy the entire JSON content from your service account file
- **Format**: Single-line JSON string
- **Example**:
```json
{"type":"service_account","project_id":"ub-mapp-sandbox","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@ub-mapp-sandbox.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40ub-mapp-sandbox.iam.gserviceaccount.com"}
```

#### `FIREBASE_PROJECT_ID`
- **Value**: Your Firebase project ID (e.g., "ub-mapp-sandbox")
- **Format**: String

## Step 6: Test the Setup

1. **Deploy to Netlify**: Push your changes to trigger a new deployment
2. **Test FCM Endpoint**: Use the test script to verify the setup:

```bash
node test-fcm.cjs
```

3. **Check Logs**: Monitor Netlify function logs for any authentication errors

## Step 7: Android App Configuration

### 1. Add Firebase to Android Project

1. **Go to Project Settings**: In Firebase Console, click the gear icon
2. **Add App**: Click "Add app" and select Android
3. **Package Name**: Enter your Android app's package name (e.g., `com.mdm.dpc`)
4. **Download google-services.json**: Download and place in `app/` directory
5. **Add Dependencies**: Add Firebase dependencies to your `build.gradle`

### 2. Android Dependencies

```gradle
// app/build.gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
    implementation 'com.google.firebase:firebase-analytics:21.0.0'
}

// Add at the bottom of build.gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. Android Manifest

```xml
<!-- AndroidManifest.xml -->
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

## Step 8: Security Best Practices

### 1. Service Account Security
- **Rotate Keys**: Regularly rotate service account keys
- **Least Privilege**: Only grant necessary permissions
- **Monitor Usage**: Monitor service account usage in Google Cloud Console

### 2. Environment Security
- **Never Log Keys**: Don't log service account keys in console
- **Secure Storage**: Use secure environment variable storage
- **Access Control**: Limit access to environment variables

### 3. Code Security
- **No Hardcoding**: Never hardcode service account keys in code
- **Environment Variables**: Always use environment variables
- **Validation**: Validate environment variables at startup

## Troubleshooting

### Common Issues:

#### 1. "FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set"
- **Solution**: Ensure the environment variable is set in Netlify
- **Check**: Verify the JSON is properly formatted as a single line

#### 2. "Failed to get access token"
- **Solution**: Check that the service account JSON is valid
- **Check**: Verify the project ID matches the service account

#### 3. "FCM request failed: Invalid token"
- **Solution**: Ensure the FCM token is valid and not expired
- **Check**: Verify the device is properly registered

#### 4. "Authentication failed"
- **Solution**: Check service account permissions
- **Check**: Ensure the service account has Firebase Cloud Messaging permissions

### Debug Steps:

1. **Check Environment Variables**: Verify both variables are set in Netlify
2. **Test Locally**: Test with a local environment first
3. **Check Logs**: Monitor Netlify function logs for detailed error messages
4. **Validate JSON**: Ensure the service account JSON is properly formatted

## Example Service Account JSON Structure

```json
{
  "type": "service_account",
  "project_id": "ub-mapp-sandbox",
  "private_key_id": "abc123def456",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@ub-mapp-sandbox.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40ub-mapp-sandbox.iam.gserviceaccount.com"
}
```

## Next Steps

After completing this setup:

1. **Test FCM Integration**: Use the test script to verify everything works
2. **Implement Android Client**: Set up FCM in your Android app
3. **Monitor Usage**: Keep an eye on FCM usage and quotas
4. **Set Up Monitoring**: Configure alerts for FCM failures

## Support

If you encounter issues:

1. **Check Firebase Console**: Verify project settings and API enablement
2. **Review Netlify Logs**: Check function logs for detailed error messages
3. **Test Environment Variables**: Ensure they're properly set
4. **Validate JSON Format**: Make sure the service account JSON is valid
