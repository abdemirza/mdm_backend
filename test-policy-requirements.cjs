const { google } = require('googleapis');

async function testPolicyRequirements() {
  try {
    console.log('🔍 Checking current policy and testing lock requirements...');
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: './mdm_server_key.json',
      scopes: ['https://www.googleapis.com/auth/androidmanagement'],
    });

    const client = await auth.getClient();
    const service = google.androidmanagement({
      version: 'v1',
      auth: client,
    });

    console.log('✅ Authentication successful');

    const enterpriseName = 'enterprises/LC048psd8h';
    const policyName = 'enterprises/LC048psd8h/policies/policy1';
    
    // Get current policy
    console.log('\n📋 Current Policy:');
    const currentPolicy = await service.enterprises.policies.get({
      name: policyName,
    });
    
    console.log('Current Policy:', JSON.stringify(currentPolicy.data, null, 2));
    
    // Test what security settings are needed for locking
    console.log('\n🔒 Testing policy requirements for device locking...');
    
    // Check if password policies are set
    const hasPasswordPolicy = currentPolicy.data.passwordPolicies;
    console.log('Password Policies:', hasPasswordPolicy ? 'Set' : 'Not Set');
    
    // Check if screen lock is required
    const hasScreenLock = currentPolicy.data.passwordPolicies?.passwordScope === 'SCOPE_DEVICE' || 
                         currentPolicy.data.passwordPolicies?.passwordScope === 'SCOPE_PROFILE';
    console.log('Screen Lock Required:', hasScreenLock ? 'Yes' : 'No');
    
    // Check security settings
    const hasSecuritySettings = currentPolicy.data.securityPolicies;
    console.log('Security Policies:', hasSecuritySettings ? 'Set' : 'Not Set');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPolicyRequirements();














