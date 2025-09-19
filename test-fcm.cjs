const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/fcm';
const CUSTOM_DEVICES_URL = 'https://poetic-llama-889a15.netlify.app/api/custom-devices';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
          });
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

// Test functions
async function testRegisterDeviceWithFCMToken() {
  console.log('📱 Testing Register Device with FCM Token...');
  
  const deviceData = {
    "imei": "111111111111113",
    "deviceName": "Test Device with FCM",
    "model": "Pixel 6",
    "manufacturer": "Google",
    "androidId": "189ee9adae9edcb8",
    "serialNumber": "TEST123456789",
    "deviceFingerprint": "google_pixel_6_test_device",
    "uniqueDeviceId": "189ee9adae9edcb8",
    "fcmToken": "dGVzdF9mY21fdG9rZW5fZm9yX3Rlc3RpbmdfcHVycG9zZXNfb25seQ" // Mock FCM token
  };

  try {
    const response = await makeRequest(`${CUSTOM_DEVICES_URL}/register`, 'POST', deviceData);
    console.log('Device Registration Response:', JSON.stringify(response, null, 2));
    return response.data.success ? deviceData : null;
  } catch (error) {
    console.error('Device Registration Error:', error);
    return null;
  }
}

async function testUpdateFCMToken(androidId, fcmToken) {
  console.log(`\n🔑 Testing Update FCM Token for Android ID: ${androidId}...`);
  
  const updateData = {
    androidId: androidId,
    fcmToken: fcmToken
  };

  try {
    const response = await makeRequest(`${BASE_URL}/update-token`, 'POST', updateData);
    console.log('Update FCM Token Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('Update FCM Token Error:', error);
    return null;
  }
}

async function testFCMLockCommand(androidId) {
  console.log(`\n🔒 Testing FCM Lock Command for Android ID: ${androidId}...`);
  
  const lockData = {
    androidId: androidId
  };

  try {
    const response = await makeRequest(`${BASE_URL}/lock`, 'POST', lockData);
    console.log('FCM Lock Command Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('FCM Lock Command Error:', error);
    return null;
  }
}

async function testFCMUnlockCommand(androidId) {
  console.log(`\n🔓 Testing FCM Unlock Command for Android ID: ${androidId}...`);
  
  const unlockData = {
    androidId: androidId
  };

  try {
    const response = await makeRequest(`${BASE_URL}/unlock`, 'POST', unlockData);
    console.log('FCM Unlock Command Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('FCM Unlock Command Error:', error);
    return null;
  }
}

async function testFCMCustomCommand(androidId) {
  console.log(`\n📨 Testing FCM Custom Command for Android ID: ${androidId}...`);
  
  const customCommandData = {
    androidId: androidId,
    command: 'CUSTOM_ACTION',
    title: 'Custom Command',
    body: 'This is a custom command sent via FCM',
    data: {
      action: 'custom_action',
      parameters: {
        param1: 'value1',
        param2: 'value2'
      }
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/custom-command`, 'POST', customCommandData);
    console.log('FCM Custom Command Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('FCM Custom Command Error:', error);
    return null;
  }
}

async function testFCMWipeCommand(androidId) {
  console.log(`\n🗑️ Testing FCM Wipe Command for Android ID: ${androidId}...`);
  
  const wipeCommandData = {
    androidId: androidId,
    command: 'WIPE_DEVICE',
    title: 'Device Wipe Command',
    body: 'Your device will be wiped. All data will be lost.',
    data: {
      action: 'wipe',
      reason: 'Security breach',
      wipeType: 'full'
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/custom-command`, 'POST', wipeCommandData);
    console.log('FCM Wipe Command Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('FCM Wipe Command Error:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting FCM Integration Tests...');
  console.log('=' .repeat(60));

  try {
    // Test 1: Register device with FCM token
    const deviceData = await testRegisterDeviceWithFCMToken();
    
    if (deviceData) {
      const androidId = deviceData.androidId;
      const fcmToken = deviceData.fcmToken;
      
      // Test 2: Update FCM token
      await testUpdateFCMToken(androidId, fcmToken);
      
      // Test 3: Send FCM lock command
      await testFCMLockCommand(androidId);
      
      // Test 4: Send FCM unlock command
      await testFCMUnlockCommand(androidId);
      
      // Test 5: Send FCM custom command
      await testFCMCustomCommand(androidId);
      
      // Test 6: Send FCM wipe command
      await testFCMWipeCommand(androidId);
    }

    console.log('\n✅ All FCM integration tests completed!');
    console.log('\n📝 Note: FCM commands will only work if:');
    console.log('   1. FCM_SERVER_KEY environment variable is set in Netlify');
    console.log('   2. The device has a valid FCM token');
    console.log('   3. The device app is configured to receive FCM messages');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testRegisterDeviceWithFCMToken,
  testUpdateFCMToken,
  testFCMLockCommand,
  testFCMUnlockCommand,
  testFCMCustomCommand,
  testFCMWipeCommand,
  runTests,
};



