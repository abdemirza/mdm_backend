// Test MongoDB Integration
const https = require('https');

const BASE_URL = 'https://poetic-llama-889a15.netlify.app';

// Test data - use timestamp to make it unique
const timestamp = Date.now();
const testDevice = {
  imei: `1234567890${timestamp.toString().slice(-5)}`,
  androidId: `${timestamp.toString(16)}`,
  deviceName: "Test Device",
  model: "Test Model",
  manufacturer: "Test Manufacturer",
  serialNumber: `TEST_SERIAL_${timestamp}`,
  deviceFingerprint: `test_fingerprint_${timestamp}`,
  uniqueDeviceId: `test_unique_id_${timestamp}`
};

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
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testMongoDBIntegration() {
  console.log('🧪 Testing MongoDB Integration...\n');

  try {
    // Test 1: Register a device
    console.log('1️⃣ Testing device registration...');
    const registerResult = await makeRequest('POST', '/api/custom-devices/register', testDevice);
    console.log('Register Result:', registerResult.status, registerResult.data);
    
    if ((registerResult.status === 200 || registerResult.status === 201) && registerResult.data.success) {
      console.log('✅ Device registered successfully in MongoDB!');
      console.log('Device ID:', registerResult.data.data._id);
    } else {
      console.log('❌ Device registration failed');
      return;
    }

    // Test 2: Get all devices
    console.log('\n2️⃣ Testing get all devices...');
    const getAllResult = await makeRequest('GET', '/api/custom-devices');
    console.log('Get All Result:', getAllResult.status, getAllResult.data);
    
    if (getAllResult.status === 200 && getAllResult.data.success) {
      console.log('✅ Retrieved devices from MongoDB!');
      console.log('Device count:', getAllResult.data.data.length);
    } else {
      console.log('❌ Get all devices failed');
    }

    // Test 3: Lock device
    console.log('\n3️⃣ Testing device lock...');
    const lockResult = await makeRequest('POST', '/api/custom-devices/lock', {
      imei: testDevice.imei
    });
    console.log('Lock Result:', lockResult.status, lockResult.data);
    
    if (lockResult.status === 200 && lockResult.data.success) {
      console.log('✅ Device locked successfully in MongoDB!');
      console.log('Lock status:', lockResult.data.data.isLocked);
    } else {
      console.log('❌ Device lock failed');
    }

    // Test 4: Get device by IMEI
    console.log('\n4️⃣ Testing get device by IMEI...');
    const getDeviceResult = await makeRequest('GET', `/api/custom-devices/device/${testDevice.imei}`);
    console.log('Get Device Result:', getDeviceResult.status, getDeviceResult.data);
    
    if (getDeviceResult.status === 200 && getDeviceResult.data.success) {
      console.log('✅ Retrieved device from MongoDB!');
      console.log('Device status:', getDeviceResult.data.data.status);
      console.log('Is locked:', getDeviceResult.data.data.isLocked);
    } else {
      console.log('❌ Get device failed');
    }

    // Test 5: Unlock device
    console.log('\n5️⃣ Testing device unlock...');
    const unlockResult = await makeRequest('POST', '/api/custom-devices/unlock', {
      imei: testDevice.imei
    });
    console.log('Unlock Result:', unlockResult.status, unlockResult.data);
    
    if (unlockResult.status === 200 && unlockResult.data.success) {
      console.log('✅ Device unlocked successfully in MongoDB!');
      console.log('Unlock status:', unlockResult.data.data.isLocked);
    } else {
      console.log('❌ Device unlock failed');
    }

    // Test 6: Get devices by status
    console.log('\n6️⃣ Testing get devices by status...');
    const getByStatusResult = await makeRequest('GET', '/api/custom-devices/status/active');
    console.log('Get By Status Result:', getByStatusResult.status, getByStatusResult.data);
    
    if (getByStatusResult.status === 200 && getByStatusResult.data.success) {
      console.log('✅ Retrieved devices by status from MongoDB!');
      console.log('Active devices count:', getByStatusResult.data.data.length);
    } else {
      console.log('❌ Get devices by status failed');
    }

    console.log('\n🎉 MongoDB Integration Test Complete!');
    console.log('📊 Check your MongoDB Atlas dashboard to see the "devices" collection created!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMongoDBIntegration();
