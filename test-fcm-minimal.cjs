const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api';
const CUSTOM_DEVICES_URL = `${BASE_URL}/custom-devices`;
const FCM_URL = `${BASE_URL}/fcm`;

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
async function testMinimalFCMFlow() {
  console.log('🚀 Testing Minimal FCM Flow...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Register a new device
    console.log('\n📱 Step 1: Registering new device...');
    
    const deviceData = {
      "imei": "555555555555555",
      "deviceName": "Minimal Test Device",
      "model": "Pixel 7",
      "manufacturer": "Google",
      "androidId": "minimal_test_android_id",
      "serialNumber": "MINIMAL123456789",
      "deviceFingerprint": "google_pixel_7_minimal_test",
      "uniqueDeviceId": "minimal_test_android_id"
    };

    const registerResponse = await makeRequest(`${CUSTOM_DEVICES_URL}/register`, 'POST', deviceData);
    console.log('Device Registration Response:', JSON.stringify(registerResponse.data, null, 2));

    if (registerResponse.data.success) {
      const androidId = deviceData.androidId;
      const fcmToken = `minimal_fcm_token_${Date.now()}`;
      
      console.log(`\n🔑 Step 2: Registering FCM token for device: ${androidId}`);
      
      // Step 2: Register FCM token
      const updateTokenResponse = await makeRequest(`${FCM_URL}/update-token`, 'POST', {
        androidId: androidId,
        fcmToken: fcmToken
      });
      
      console.log('FCM Token Registration Response:', JSON.stringify(updateTokenResponse.data, null, 2));
      
      if (updateTokenResponse.data.success) {
        console.log(`\n🔒 Step 3: Sending lock command to device: ${androidId}`);
        
        // Step 3: Send lock command
        const lockResponse = await makeRequest(`${FCM_URL}/lock`, 'POST', {
          androidId: androidId
        });
        
        console.log('FCM Lock Command Response:', JSON.stringify(lockResponse.data, null, 2));
        
        if (lockResponse.data.success) {
          console.log(`\n🔓 Step 4: Sending unlock command to device: ${androidId}`);
          
          // Step 4: Send unlock command
          const unlockResponse = await makeRequest(`${FCM_URL}/unlock`, 'POST', {
            androidId: androidId
          });
          
          console.log('FCM Unlock Command Response:', JSON.stringify(unlockResponse.data, null, 2));
          
          console.log(`\n📨 Step 5: Sending custom command to device: ${androidId}`);
          
          // Step 5: Send custom command
          const customResponse = await makeRequest(`${FCM_URL}/custom-command`, 'POST', {
            androidId: androidId,
            command: 'MINIMAL_ACTION',
            title: 'Minimal Test Command',
            body: 'This is a minimal test command sent via FCM (simulated)',
            data: {
              action: 'minimal_test_action',
              parameters: {
                param1: 'minimal_value1',
                param2: 'minimal_value2'
              }
            }
          });
          
          console.log('FCM Custom Command Response:', JSON.stringify(customResponse.data, null, 2));
          
        } else {
          console.log('❌ Lock command failed:', lockResponse.data.error);
        }
      } else {
        console.log('❌ FCM token registration failed:', updateTokenResponse.data.error);
      }
    } else {
      console.log('❌ Device registration failed:', registerResponse.data.error);
    }

    console.log('\n✅ Minimal FCM flow test completed!');
    console.log('\n📝 Note: This minimal FCM service:');
    console.log('   ✅ Simulates FCM notifications (logged but not sent)');
    console.log('   ✅ Updates device status in database');
    console.log('   ✅ Provides same API responses');
    console.log('   ⚠️  Does not send real push notifications');
    console.log('\n🔧 Setup Guide: See MINIMAL_FCM_SETUP.md for detailed setup instructions');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMinimalFCMFlow();
}

module.exports = {
  testMinimalFCMFlow,
};
