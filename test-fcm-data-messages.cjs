// Test FCM Data Messages vs Push Notifications
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

async function testFCMDataMessages() {
  console.log('🔥 Testing FCM Data Messages vs Push Notifications...\n');

  try {
    // Test data - use timestamp to make it unique
    const timestamp = Date.now();
    const testDevice = {
      imei: `1234567890${timestamp.toString().slice(-5)}`,
      androidId: `${timestamp.toString(16)}`,
      deviceName: "FCM Data Messages Test Device",
      model: "FCM Data Messages Test Model",
      manufacturer: "FCM Data Messages Test Manufacturer",
      serialNumber: `FCM_DATA_SERIAL_${timestamp}`,
      deviceFingerprint: `fcm_data_fingerprint_${timestamp}`,
      uniqueDeviceId: `fcm_data_unique_id_${timestamp}`
    };

    // Test 1: Register a device
    console.log('1️⃣ Registering test device...');
    const registerResult = await makeRequest('POST', '/api/custom-devices/register', testDevice);
    console.log('Register Result:', registerResult.status, registerResult.data);
    
    if ((registerResult.status === 200 || registerResult.status === 201) && registerResult.data.success) {
      console.log('✅ Device registered successfully!');
    } else {
      console.log('❌ Device registration failed');
      return;
    }

    // Test 2: Check FCM Data Messages configuration
    console.log('\n2️⃣ Checking FCM Data Messages configuration...');
    const configResult = await makeRequest('GET', '/api/fcm-data/debug-config');
    console.log('Config Result:', configResult.status, configResult.data);
    
    if (configResult.status === 200 && configResult.data.success) {
      console.log('✅ FCM Data Messages configuration is ready!');
    } else {
      console.log('❌ FCM Data Messages configuration failed');
    }

    // Test 3: Send lock command using FCM data message
    console.log('\n3️⃣ Testing lock command with FCM data message...');
    const lockResult = await makeRequest('POST', '/api/fcm-data/lock', {
      imei: testDevice.imei
    });
    console.log('Lock Result:', lockResult.status, lockResult.data);
    
    if (lockResult.status === 200 && lockResult.data.success) {
      console.log('✅ Lock command sent via FCM data message!');
      console.log('FCM Message ID:', lockResult.data.data.fcmResult.messageId);
    } else {
      console.log('❌ Lock command failed');
    }

    // Test 4: Send unlock command using FCM data message
    console.log('\n4️⃣ Testing unlock command with FCM data message...');
    const unlockResult = await makeRequest('POST', '/api/fcm-data/unlock', {
      imei: testDevice.imei
    });
    console.log('Unlock Result:', unlockResult.status, unlockResult.data);
    
    if (unlockResult.status === 200 && unlockResult.data.success) {
      console.log('✅ Unlock command sent via FCM data message!');
      console.log('FCM Message ID:', unlockResult.data.data.fcmResult.messageId);
    } else {
      console.log('❌ Unlock command failed');
    }

    // Test 5: Send custom command using FCM data message
    console.log('\n5️⃣ Testing custom command with FCM data message...');
    const customResult = await makeRequest('POST', '/api/fcm-data/custom-command', {
      imei: testDevice.imei,
      command: 'RESTART_DEVICE',
      data: {
        reason: 'Scheduled maintenance',
        force: 'true'
      }
    });
    console.log('Custom Command Result:', customResult.status, customResult.data);
    
    if (customResult.status === 200 && customResult.data.success) {
      console.log('✅ Custom command sent via FCM data message!');
      console.log('FCM Message ID:', customResult.data.data.fcmResult.messageId);
    } else {
      console.log('❌ Custom command failed');
    }

    // Test 6: Send test data message directly
    console.log('\n6️⃣ Testing direct FCM data message...');
    const testDataResult = await makeRequest('POST', '/api/fcm-data/test-data-message', {
      fcmToken: 'test_fcm_token_' + testDevice.androidId,
      testData: {
        test_message: 'This is a test data message',
        test_timestamp: new Date().toISOString()
      }
    });
    console.log('Test Data Message Result:', testDataResult.status, testDataResult.data);
    
    if (testDataResult.status === 200 && testDataResult.data.success) {
      console.log('✅ Test data message sent successfully!');
      console.log('FCM Message ID:', testDataResult.data.data.messageId);
    } else {
      console.log('❌ Test data message failed');
    }

    console.log('\n🎉 FCM Data Messages Test Complete!');
    console.log('\n📊 Key Differences:');
    console.log('🔔 Push Notifications:');
    console.log('   - Show notification to user');
    console.log('   - Require user interaction');
    console.log('   - May be dismissed by user');
    console.log('   - Limited data payload');
    console.log('   - Can be blocked by user settings');
    console.log('');
    console.log('📱 Data Messages:');
    console.log('   - No visible notification');
    console.log('   - Direct to app background');
    console.log('   - Cannot be dismissed by user');
    console.log('   - Full data payload');
    console.log('   - Always delivered to app');
    console.log('   - Perfect for MDM commands!');
    console.log('');
    console.log('🔥 FCM Data Messages are ideal for MDM commands because:');
    console.log('   ✅ Silent delivery (no user notification)');
    console.log('   ✅ Reliable delivery to app background');
    console.log('   ✅ Cannot be blocked by user');
    console.log('   ✅ Full command data payload');
    console.log('   ✅ Works even when app is killed');
    console.log('   ✅ Perfect for lock/unlock commands');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFCMDataMessages();
