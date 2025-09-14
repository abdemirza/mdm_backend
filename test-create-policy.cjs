const https = require('https');

// Configuration
const BASE_URL = 'https://poetic-llama-889a15.netlify.app/api/devices';

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
async function testListPolicies() {
  console.log('📋 Testing List Policies...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/policies`);
    console.log('List Policies Response:', JSON.stringify(response, null, 2));
    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error('List Policies Error:', error);
    return [];
  }
}

async function testCreateBasicPolicy() {
  console.log('\n🔧 Testing Create Basic Policy...');
  
  const policyData = {
    policyId: 'test_policy_basic',
    displayName: 'Test Basic Policy',
    description: 'A basic test policy created via API',
    settings: {
      // Basic security settings
      cameraDisabled: false,
      bluetoothConfigDisabled: false,
      wifiConfigDisabled: false,
      usbFileTransferDisabled: true,
      installAppsDisabled: false,
      uninstallAppsDisabled: true,
      playStoreMode: 'PLAY_STORE_MODE_ALLOWLIST',
      screenCaptureDisabled: false,
      locationMode: 'LOCATION_MODE_DISABLED',
      safeBootDisabled: true,
      factoryResetDisabled: true,
      ensureVerifyApps: true
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/policies`, 'POST', policyData);
    console.log('Create Basic Policy Response:', JSON.stringify(response, null, 2));
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Create Basic Policy Error:', error);
    return null;
  }
}

async function testCreateRestrictivePolicy() {
  console.log('\n🔒 Testing Create Restrictive Policy...');
  
  const policyData = {
    policyId: 'test_policy_restrictive',
    displayName: 'Test Restrictive Policy',
    description: 'A restrictive test policy with maximum security',
    settings: {
      // Restrictive security settings
      cameraDisabled: true,
      bluetoothConfigDisabled: true,
      wifiConfigDisabled: true,
      usbFileTransferDisabled: true,
      installAppsDisabled: true,
      uninstallAppsDisabled: true,
      playStoreMode: 'PLAY_STORE_MODE_BLOCKLIST',
      screenCaptureDisabled: true,
      locationMode: 'LOCATION_MODE_DISABLED',
      safeBootDisabled: true,
      factoryResetDisabled: true,
      ensureVerifyApps: true,
      modifyAccountsDisabled: true,
      addUserDisabled: true,
      removeUserDisabled: true,
      setUserRestrictionsDisabled: true,
      setGlobalProxyDisabled: true,
      setAlwaysOnVpnDisabled: true,
      setPermittedAccessibilityServicesDisabled: true,
      setPermittedInputMethodsDisabled: true,
      setPermittedCrossProfileNotificationListenersDisabled: true,
      setPermittedCrossProfileCallerIdDisabled: true,
      setPermittedCrossProfileContactsDisabled: true
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/policies`, 'POST', policyData);
    console.log('Create Restrictive Policy Response:', JSON.stringify(response, null, 2));
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Create Restrictive Policy Error:', error);
    return null;
  }
}

async function testCreatePolicyWithPassword() {
  console.log('\n🔐 Testing Create Policy with Password Requirements...');
  
  const policyData = {
    policyId: 'test_policy_password',
    displayName: 'Test Password Policy',
    description: 'A policy with password requirements',
    settings: {
      // Password policies
      passwordPolicies: {
        passwordScope: 'SCOPE_DEVICE',
        passwordQuality: 'PASSWORD_QUALITY_ALPHANUMERIC',
        passwordMinimumLength: 8,
        passwordMinimumLetters: 1,
        passwordMinimumLowerCase: 1,
        passwordMinimumUpperCase: 1,
        passwordMinimumNumeric: 1,
        passwordMinimumSymbols: 1,
        passwordMinimumNonLetter: 1,
        maximumFailedPasswordsForWipe: 5,
        passwordExpirationTimeout: '7776000000000', // 90 days in microseconds
        passwordHistoryLength: 3
      },
      // Basic settings
      cameraDisabled: false,
      bluetoothConfigDisabled: false,
      wifiConfigDisabled: false,
      usbFileTransferDisabled: true,
      installAppsDisabled: false,
      uninstallAppsDisabled: false,
      playStoreMode: 'PLAY_STORE_MODE_ALLOWLIST',
      screenCaptureDisabled: false,
      locationMode: 'LOCATION_MODE_DISABLED',
      safeBootDisabled: true,
      factoryResetDisabled: true,
      ensureVerifyApps: true
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/policies`, 'POST', policyData);
    console.log('Create Password Policy Response:', JSON.stringify(response, null, 2));
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Create Password Policy Error:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Policy Creation Tests...');
  console.log('=' .repeat(60));

  try {
    // Test listing existing policies
    await testListPolicies();
    
    // Test creating different types of policies
    await testCreateBasicPolicy();
    await testCreateRestrictivePolicy();
    await testCreatePolicyWithPassword();
    
    // List policies again to see the new ones
    console.log('\n📋 Final Policy List:');
    await testListPolicies();

    console.log('\n✅ All policy creation tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testListPolicies,
  testCreateBasicPolicy,
  testCreateRestrictivePolicy,
  testCreatePolicyWithPassword,
  runTests,
};
