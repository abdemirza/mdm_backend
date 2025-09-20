#!/usr/bin/env node

// Test script to help get real FCM tokens
const https = require('https');

const BASE_URL = 'https://poetic-llama-889a15.netlify.app';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'poetic-llama-889a15.netlify.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDebugConfig() {
  console.log('🔍 Testing Firebase Configuration...\n');
  
  try {
    const response = await makeRequest('GET', '/api/fcm-real/debug-config');
    
    console.log('📊 Debug Config Response:');
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const config = response.data.data.config;
      console.log('\n✅ Configuration Status:');
      console.log(`Project ID: ${config.projectId || 'NOT_SET'}`);
      console.log(`Client Email: ${config.clientEmail || 'NOT_SET'}`);
      console.log(`Private Key: ${config.privateKey}`);
      console.log(`Private Key Length: ${config.privateKeyLength}`);
      console.log(`Has All Config: ${config.hasAllConfig}`);
      
      if (config.hasAllConfig) {
        console.log('\n🎉 Firebase configuration looks good!');
      } else {
        console.log('\n❌ Firebase configuration is incomplete!');
        console.log('Please check your Netlify environment variables:');
        console.log('- FIREBASE_PROJECT_ID');
        console.log('- FIREBASE_CLIENT_EMAIL');
        console.log('- FIREBASE_PRIVATE_KEY');
      }
    }
  } catch (error) {
    console.error('❌ Error testing debug config:', error.message);
  }
}

async function testDirectNotification(fcmToken) {
  console.log('\n🧪 Testing Direct FCM Notification...\n');
  
  if (!fcmToken) {
    console.log('❌ No FCM token provided. Please provide a real FCM token from your Android app.');
    console.log('\n📱 To get a real FCM token:');
    console.log('1. Install Firebase SDK in your Android DPC app');
    console.log('2. Add FCM dependency to build.gradle');
    console.log('3. Implement FirebaseMessagingService');
    console.log('4. Get token using FirebaseMessaging.getInstance().getToken()');
    console.log('5. Send token to your backend via /api/fcm-real/update-token');
    return;
  }
  
  try {
    const response = await makeRequest('POST', '/api/fcm-real/test-direct', {
      fcmToken: fcmToken,
      title: 'Test Notification',
      body: 'This is a test notification from the backend'
    });
    
    console.log('📱 Direct Test Response:');
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Test notification sent successfully!');
      console.log('Check your Android device for the notification.');
    } else {
      console.log('\n❌ Test notification failed!');
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error testing direct notification:', error.message);
  }
}

async function testWithRegisteredDevice() {
  console.log('\n🔍 Testing with Registered Device...\n');
  
  try {
    const response = await makeRequest('POST', '/api/fcm-real/test-notification', {
      androidId: '6a45f97fe76a09da'
    });
    
    console.log('📱 Device Test Response:');
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Device test notification sent successfully!');
      console.log('Check your Android device for the notification.');
    } else {
      console.log('\n❌ Device test notification failed!');
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error testing device notification:', error.message);
  }
}

async function main() {
  console.log('🚀 FCM Token Testing Script\n');
  console.log('This script helps you test FCM notifications with your backend.\n');
  
  // Test 1: Check Firebase configuration
  await testDebugConfig();
  
  // Test 2: Test with registered device
  await testWithRegisteredDevice();
  
  // Test 3: Test with direct FCM token (if provided)
  const fcmToken = process.argv[2];
  if (fcmToken) {
    await testDirectNotification(fcmToken);
  } else {
    console.log('\n💡 To test with a real FCM token, run:');
    console.log('node test-fcm-token.cjs YOUR_FCM_TOKEN_HERE');
    console.log('\n📱 To get a real FCM token from your Android app:');
    console.log('1. Add Firebase to your Android project');
    console.log('2. Implement FirebaseMessagingService');
    console.log('3. Get token: FirebaseMessaging.getInstance().getToken()');
    console.log('4. Send to backend: POST /api/fcm-real/update-token');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check Firebase configuration above');
  console.log('2. Get real FCM token from your Android app');
  console.log('3. Test with: node test-fcm-token.cjs YOUR_FCM_TOKEN');
  console.log('4. Check your Android device for notifications');
}

main().catch(console.error);
