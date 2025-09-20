// Test Device Registration
const https = require('https');

async function testDeviceRegistration() {
  console.log('🧪 Testing Device Registration...\n');

  try {
    // Test data
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

    console.log('1️⃣ Testing device registration...');
    
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'poetic-llama-889a15.netlify.app',
        port: 443,
        path: '/api/custom-devices/register',
        method: 'POST',
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
      req.write(JSON.stringify(testDevice));
      req.end();
    });

    console.log('Register Result:', result.status, result.data);
    
    if ((result.status === 200 || result.status === 201) && result.data.success) {
      console.log('✅ Device registration successful!');
      console.log('Device ID:', result.data.data.id);
      console.log('IMEI:', result.data.data.imei);
      console.log('Android ID:', result.data.data.androidId);
    } else {
      console.log('❌ Device registration failed');
      console.log('Error details:', result.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeviceRegistration();
