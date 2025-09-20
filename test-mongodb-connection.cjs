// Test MongoDB Connection
const https = require('https');

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');

  try {
    // Test 1: Check if custom-devices endpoint is working
    console.log('1️⃣ Testing custom-devices endpoint...');
    
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'poetic-llama-889a15.netlify.app',
        port: 443,
        path: '/api/custom-devices',
        method: 'GET',
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
      req.end();
    });

    console.log('Result:', result.status, result.data);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Custom devices endpoint is working!');
      console.log('Device count:', result.data.data.length);
    } else if (result.status === 502) {
      console.log('❌ Function is still using old code (502 error)');
      console.log('This means the deployment hasn\'t updated yet or there\'s still an import issue');
    } else {
      console.log('❌ Unexpected response:', result.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMongoDBConnection();
