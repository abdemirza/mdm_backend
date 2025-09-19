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
async function testCompleteFCMFlow() {
  console.log('🚀 Testing Complete FCM Flow...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check existing devices
    console.log('\n📱 Step 1: Checking existing devices...');
    const devicesResponse = await makeRequest(`${CUSTOM_DEVICES_URL}`);
    console.log('Existing devices:', JSON.stringify(devicesResponse.data, null, 2));

    if (devicesResponse.data.success && devicesResponse.data.data.length > 0) {
      const device = devicesResponse.data.data[0];
      const androidId = device.androidId;
      
      console.log(`\n🔑 Step 2: Registering FCM token for device: ${androidId}`);
      
      // Step 2: Register FCM token
      const fcmToken = `test_fcm_token_${Date.now()}`;
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
            command: 'CUSTOM_ACTION',
            title: 'Test Custom Command',
            body: 'This is a test custom command sent via FCM',
            data: {
              action: 'test_action',
              parameters: {
                param1: 'value1',
                param2: 'value2'
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
      console.log('❌ No devices found. Please register a device first.');
    }

    console.log('\n✅ Complete FCM flow test completed!');
    console.log('\n📝 Note: FCM commands will only work if:');
    console.log('   1. FIREBASE_SERVICE_ACCOUNT_KEY environment variable is set in Netlify');
    console.log('   2. FIREBASE_PROJECT_ID environment variable is set in Netlify');
    console.log('   3. The device has a valid FCM token registered');
    console.log('   4. The device app is configured to receive FCM messages');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCompleteFCMFlow();
}

module.exports = {
  testCompleteFCMFlow,
};
