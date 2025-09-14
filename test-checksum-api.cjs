const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/checksum';

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
async function testGetChecksum() {
  console.log('🔐 Testing Get Checksum...');
  
  try {
    const response = await makeRequest(`${BASE_URL}?type=checksum`);
    console.log('Checksum Response:', JSON.stringify(response, null, 2));
    return response.data.success ? response.data.data.checksum : null;
  } catch (error) {
    console.error('Get Checksum Error:', error);
    return null;
  }
}

async function testGetProvisioningPayload() {
  console.log('\n🎯 Testing Get Provisioning Payload...');
  
  try {
    const response = await makeRequest(`${BASE_URL}?type=payload`);
    console.log('Provisioning Payload Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Get Provisioning Payload Error:', error);
  }
}

async function testVerifyChecksum(checksum) {
  console.log(`\n✅ Testing Verify Checksum: ${checksum}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}?type=verify&checksum=${checksum}`);
    console.log('Verify Checksum Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Verify Checksum Error:', error);
  }
}

async function testVerifyInvalidChecksum() {
  console.log('\n❌ Testing Verify Invalid Checksum...');
  
  const invalidChecksum = 'invalid_checksum_123456789';
  try {
    const response = await makeRequest(`${BASE_URL}?type=verify&checksum=${invalidChecksum}`);
    console.log('Verify Invalid Checksum Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Verify Invalid Checksum Error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Checksum API Tests...');
  console.log('=' .repeat(50));

  try {
    // Test getting checksum
    const checksum = await testGetChecksum();
    
    if (checksum) {
      // Test getting provisioning payload
      await testGetProvisioningPayload();
      
      // Test verifying valid checksum
      await testVerifyChecksum(checksum);
      
      // Test verifying invalid checksum
      await testVerifyInvalidChecksum();
    }

    console.log('\n✅ All checksum API tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetChecksum,
  testGetProvisioningPayload,
  testVerifyChecksum,
  testVerifyInvalidChecksum,
  runTests,
};
