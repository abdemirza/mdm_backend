const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/custom-devices';

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
async function testDeviceRegistration() {
  console.log('🔧 Testing Device Registration...');
  
  const deviceData = {
    imei: '123456789012345',
    serialNumber: 'SN123456789',
    deviceId: 'device_001',
    androidId: 'android_12345',
    macAddress: '00:11:22:33:44:55',
    deviceName: 'Test Device',
    model: 'Pixel 6',
    manufacturer: 'Google',
    osVersion: 'Android 13',
    customData: {
      location: 'Office',
      department: 'IT',
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/register`, 'POST', deviceData);
    console.log('Registration Response:', JSON.stringify(response, null, 2));
    return response.data.success ? deviceData.imei : null;
  } catch (error) {
    console.error('Registration Error:', error);
    return null;
  }
}

async function testGetAllDevices() {
  console.log('\n📱 Testing Get All Devices...');
  
  try {
    const response = await makeRequest(`${BASE_URL}`);
    console.log('All Devices Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Get All Devices Error:', error);
  }
}

async function testGetDevice(imei) {
  console.log(`\n🔍 Testing Get Device: ${imei}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/device/${imei}`);
    console.log('Get Device Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Get Device Error:', error);
  }
}

async function testLockDevice(imei) {
  console.log(`\n🔒 Testing Lock Device: ${imei}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/lock`, 'POST', { imei });
    console.log('Lock Device Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Lock Device Error:', error);
  }
}

async function testUnlockDevice(imei) {
  console.log(`\n🔓 Testing Unlock Device: ${imei}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/unlock`, 'POST', { imei });
    console.log('Unlock Device Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Unlock Device Error:', error);
  }
}

async function testGetDevicesByStatus(status) {
  console.log(`\n📊 Testing Get Devices by Status: ${status}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/status/${status}`);
    console.log('Get Devices by Status Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Get Devices by Status Error:', error);
  }
}

async function testUpdateDeviceStatus(imei) {
  console.log(`\n🔄 Testing Update Device Status: ${imei}...`);
  
  const updateData = {
    imei,
    deviceName: 'Updated Test Device',
    status: 'active',
    customData: {
      location: 'Home',
      department: 'IT',
      lastUpdate: new Date().toISOString(),
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/update-status`, 'POST', updateData);
    console.log('Update Device Status Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Update Device Status Error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Custom Device API Tests...');
  console.log('=' .repeat(50));

  try {
    // Test device registration
    const imei = await testDeviceRegistration();
    
    if (imei) {
      // Test getting all devices
      await testGetAllDevices();
      
      // Test getting specific device
      await testGetDevice(imei);
      
      // Test locking device
      await testLockDevice(imei);
      
      // Test getting locked devices
      await testGetDevicesByStatus('locked');
      
      // Test unlocking device
      await testUnlockDevice(imei);
      
      // Test getting active devices
      await testGetDevicesByStatus('active');
      
      // Test updating device status
      await testUpdateDeviceStatus(imei);
      
      // Final check - get all devices
      await testGetAllDevices();
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testDeviceRegistration,
  testGetAllDevices,
  testGetDevice,
  testLockDevice,
  testUnlockDevice,
  testGetDevicesByStatus,
  testUpdateDeviceStatus,
  runTests,
};
