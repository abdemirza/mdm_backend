const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/device-status';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
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

    req.end();
  });
}

// Test functions
async function testDeviceStatusByImei(imei) {
  console.log(`🔍 Testing Device Status by IMEI: ${imei}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/imei/${imei}`);
    console.log('Device Status Response:', JSON.stringify(response, null, 2));
    return response.data;
  } catch (error) {
    console.error('Device Status Error:', error);
    return null;
  }
}

async function testInvalidImei() {
  console.log('\n❌ Testing Invalid IMEI Format...');
  
  const invalidImei = '123456789'; // Too short
  try {
    const response = await makeRequest(`${BASE_URL}/imei/${invalidImei}`);
    console.log('Invalid IMEI Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Invalid IMEI Error:', error);
  }
}

async function testNonExistentImei() {
  console.log('\n🔍 Testing Non-Existent IMEI...');
  
  const nonExistentImei = '999999999999999'; // Valid format but likely doesn't exist
  try {
    const response = await makeRequest(`${BASE_URL}/imei/${nonExistentImei}`);
    console.log('Non-Existent IMEI Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Non-Existent IMEI Error:', error);
  }
}

async function testCustomDeviceImei() {
  console.log('\n📱 Testing Custom Device IMEI...');
  
  // Use the IMEI from our custom device registration test
  const customDeviceImei = '123456789012345';
  try {
    const response = await makeRequest(`${BASE_URL}/imei/${customDeviceImei}`);
    console.log('Custom Device IMEI Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Custom Device IMEI Error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Device Status API Tests...');
  console.log('=' .repeat(60));

  try {
    // Test with a sample IMEI (you can replace with actual IMEI from your devices)
    const sampleImei = '123456789012345';
    await testDeviceStatusByImei(sampleImei);
    
    // Test invalid IMEI format
    await testInvalidImei();
    
    // Test non-existent IMEI
    await testNonExistentImei();
    
    // Test custom device IMEI
    await testCustomDeviceImei();

    console.log('\n✅ All device status tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testDeviceStatusByImei,
  testInvalidImei,
  testNonExistentImei,
  testCustomDeviceImei,
  runTests,
};