// Test Firebase Admin SDK Integration
const https = require('https');

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

async function testFirebaseAdminIntegration() {
  console.log('🔥 Testing Firebase Admin SDK Integration...\n');

  try {
    // Test data - use timestamp to make it unique
    const timestamp = Date.now();
    const testDevice = {
      imei: `1234567890${timestamp.toString().slice(-5)}`,
      androidId: `${timestamp.toString(16)}`,
      deviceName: "Firebase Admin Test Device",
      model: "Firebase Admin Test Model",
      manufacturer: "Firebase Admin Test Manufacturer",
      serialNumber: `FIREBASE_ADMIN_SERIAL_${timestamp}`,
      deviceFingerprint: `firebase_admin_fingerprint_${timestamp}`,
      uniqueDeviceId: `firebase_admin_unique_id_${timestamp}`
    };

    // Test 1: Register a device using Firebase Admin SDK
    console.log('1️⃣ Testing device registration with Firebase Admin SDK...');
    const registerResult = await makeRequest('POST', '/api/custom-devices/register', testDevice);
    console.log('Register Result:', registerResult.status, registerResult.data);
    
    if ((registerResult.status === 200 || registerResult.status === 201) && registerResult.data.success) {
      console.log('✅ Device registered successfully with Firebase Admin SDK!');
      console.log('Device ID:', registerResult.data.data.id);
    } else {
      console.log('❌ Device registration failed');
      console.log('Error details:', registerResult.data);
      return;
    }

    // Test 2: Get all devices from Firestore
    console.log('\n2️⃣ Testing get all devices from Firestore...');
    const getAllResult = await makeRequest('GET', '/api/custom-devices');
    console.log('Get All Result:', getAllResult.status, getAllResult.data);
    
    if (getAllResult.status === 200 && getAllResult.data.success) {
      console.log('✅ Retrieved devices from Firestore!');
      console.log('Device count:', getAllResult.data.data.length);
    } else {
      console.log('❌ Get all devices failed');
    }

    // Test 3: Lock device in Firestore
    console.log('\n3️⃣ Testing device lock in Firestore...');
    const lockResult = await makeRequest('POST', '/api/custom-devices/lock', {
      imei: testDevice.imei
    });
    console.log('Lock Result:', lockResult.status, lockResult.data);
    
    if (lockResult.status === 200 && lockResult.data.success) {
      console.log('✅ Device locked successfully in Firestore!');
      console.log('Lock status:', lockResult.data.data.isLocked);
    } else {
      console.log('❌ Device lock failed');
    }

    // Test 4: Get device by IMEI from Firestore
    console.log('\n4️⃣ Testing get device by IMEI from Firestore...');
    const getDeviceResult = await makeRequest('GET', `/api/custom-devices/device/${testDevice.imei}`);
    console.log('Get Device Result:', getDeviceResult.status, getDeviceResult.data);
    
    if (getDeviceResult.status === 200 && getDeviceResult.data.success) {
      console.log('✅ Retrieved device from Firestore!');
      console.log('Device status:', getDeviceResult.data.data.status);
      console.log('Is locked:', getDeviceResult.data.data.isLocked);
    } else {
      console.log('❌ Get device failed');
    }

    // Test 5: Unlock device in Firestore
    console.log('\n5️⃣ Testing device unlock in Firestore...');
    const unlockResult = await makeRequest('POST', '/api/custom-devices/unlock', {
      imei: testDevice.imei
    });
    console.log('Unlock Result:', unlockResult.status, unlockResult.data);
    
    if (unlockResult.status === 200 && unlockResult.data.success) {
      console.log('✅ Device unlocked successfully in Firestore!');
      console.log('Unlock status:', unlockResult.data.data.isLocked);
    } else {
      console.log('❌ Device unlock failed');
    }

    // Test 6: Get devices by status from Firestore
    console.log('\n6️⃣ Testing get devices by status from Firestore...');
    const getByStatusResult = await makeRequest('GET', '/api/custom-devices/status/active');
    console.log('Get By Status Result:', getByStatusResult.status, getByStatusResult.data);
    
    if (getByStatusResult.status === 200 && getByStatusResult.data.success) {
      console.log('✅ Retrieved devices by status from Firestore!');
      console.log('Active devices count:', getByStatusResult.data.data.length);
    } else {
      console.log('❌ Get devices by status failed');
    }

    console.log('\n🎉 Firebase Admin SDK Integration Test Complete!');
    console.log('📊 Check your Firebase Console to see the "devices" collection created!');
    console.log('🔗 Firebase Console: https://console.firebase.google.com/project/mdm-android-d0d99/firestore');
    console.log('🔥 Using Firebase Admin SDK for reliable Firestore operations!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFirebaseAdminIntegration();
