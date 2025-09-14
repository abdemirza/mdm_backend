const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/custom-devices';
const STATUS_URL = 'https://poetic-llama-889a15.netlify.app/api/device-status';

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
async function testNewRegistrationPayload() {
  console.log('📱 Testing New Registration Payload...');
  
  const deviceData = {
    "imei": "111111111111112",
    "deviceName": "sdk_gphone64_arm64",
    "model": "sdk_gphone64_arm64",
    "manufacturer": "Google",
    "androidId": "189ee9adae9edcb7",
    "serialNumber": "EMULATOR35X3X11X0",
    "deviceFingerprint": "google_sdk_gphone64_arm64_emu64a_goldfish_arm64",
    "uniqueDeviceId": "189ee9adae9edcb7"
  };

  try {
    const response = await makeRequest(`${BASE_URL}/register`, 'POST', deviceData);
    console.log('Registration Response:', JSON.stringify(response, null, 2));
    return response.data.success ? deviceData : null;
  } catch (error) {
    console.error('Registration Error:', error);
    return null;
  }
}

async function testDeviceStatusByImei(imei) {
  console.log(`\n🔍 Testing Device Status by IMEI: ${imei}...`);
  
  try {
    const response = await makeRequest(`${STATUS_URL}/imei/${imei}`);
    console.log('Device Status by IMEI Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Device Status by IMEI Error:', error);
  }
}

async function testDeviceStatusByAndroidId(androidId) {
  console.log(`\n🔍 Testing Device Status by Android ID: ${androidId}...`);
  
  try {
    const response = await makeRequest(`${STATUS_URL}/androidid/${androidId}`);
    console.log('Device Status by Android ID Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Device Status by Android ID Error:', error);
  }
}

async function testLockDeviceByAndroidId(androidId) {
  console.log(`\n🔒 Testing Lock Device by Android ID: ${androidId}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/lock`, 'POST', { androidId });
    console.log('Lock Device by Android ID Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Lock Device by Android ID Error:', error);
  }
}

async function testUnlockDeviceByAndroidId(androidId) {
  console.log(`\n🔓 Testing Unlock Device by Android ID: ${androidId}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/unlock`, 'POST', { androidId });
    console.log('Unlock Device by Android ID Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Unlock Device by Android ID Error:', error);
  }
}

async function testGetAllDevices() {
  console.log('\n📋 Testing Get All Devices...');
  
  try {
    const response = await makeRequest(`${BASE_URL}`);
    console.log('All Devices Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Get All Devices Error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting New Registration Payload Tests...');
  console.log('=' .repeat(60));

  try {
    // Test new registration payload
    const deviceData = await testNewRegistrationPayload();
    
    if (deviceData) {
      // Test device status by IMEI
      await testDeviceStatusByImei(deviceData.imei);
      
      // Test device status by Android ID
      await testDeviceStatusByAndroidId(deviceData.androidId);
      
      // Test lock device by Android ID
      await testLockDeviceByAndroidId(deviceData.androidId);
      
      // Test unlock device by Android ID
      await testUnlockDeviceByAndroidId(deviceData.androidId);
      
      // Test get all devices
      await testGetAllDevices();
    }

    console.log('\n✅ All new registration payload tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testNewRegistrationPayload,
  testDeviceStatusByImei,
  testDeviceStatusByAndroidId,
  testLockDeviceByAndroidId,
  testUnlockDeviceByAndroidId,
  testGetAllDevices,
  runTests,
};
