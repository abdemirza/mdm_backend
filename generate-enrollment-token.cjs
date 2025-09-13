const { google } = require('googleapis');
const fs = require('fs');

// Configuration
const ENTERPRISE_ID = 'LC048psd8h';
const POLICY_NAME = `enterprises/${ENTERPRISE_ID}/policies/policy1`;
const SERVICE_ACCOUNT_FILE = './mdm_server_key.json';

async function createEnrollmentToken() {
  try {
    console.log('🔐 Authenticating with Google Cloud...');
    
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ['https://www.googleapis.com/auth/androidmanagement'],
    });

    const client = await auth.getClient();
    const service = google.androidmanagement({
      version: 'v1',
      auth: client,
    });

    const enterpriseName = `enterprises/${ENTERPRISE_ID}`;
    
    console.log(`📱 Creating enrollment token for enterprise: ${enterpriseName}`);
    console.log(`📋 Policy: ${POLICY_NAME}`);

    const enrollmentTokenRequest = {
      policyName: POLICY_NAME,
      duration: '3600s' // 1 hour duration
    };

    const response = await service.enterprises.enrollmentTokens.create({
      parent: enterpriseName,
      requestBody: enrollmentTokenRequest,
    });

    const token = response.data;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ENROLLMENT TOKEN CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    
    console.log(`📝 Token Name: ${token.name}`);
    console.log(`🔑 Token Value: ${token.value}`);
    console.log(`⏰ Expires: ${token.expirationTimestamp}`);
    console.log(`📋 Policy: ${token.policyName}`);
    
    // Extract QR code content
    if (token.qrCode) {
      console.log(`\n📱 QR Code Content:`);
      console.log(token.qrCode);
      
      // Save QR code content to file
      fs.writeFileSync('enrollment-qr-content.json', JSON.stringify(JSON.parse(token.qrCode), null, 2));
      console.log(`\n💾 QR Code content saved to: enrollment-qr-content.json`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📖 USAGE INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('1. Use this token in your provisioning payload:');
    console.log(`   "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "${token.value}"`);
    console.log('\n2. Or scan the QR code during device setup');
    console.log(`\n3. Token expires at: ${token.expirationTimestamp}`);
    console.log('\n4. Generate a new token if this one expires');
    
    return token;
    
  } catch (error) {
    console.error('❌ Error creating enrollment token:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

async function listExistingTokens() {
  try {
    console.log('🔐 Authenticating with Google Cloud...');
    
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ['https://www.googleapis.com/auth/androidmanagement'],
    });

    const client = await auth.getClient();
    const service = google.androidmanagement({
      version: 'v1',
      auth: client,
    });

    const enterpriseName = `enterprises/${ENTERPRISE_ID}`;
    
    console.log(`📱 Listing enrollment tokens for: ${enterpriseName}`);

    const response = await service.enterprises.enrollmentTokens.list({
      parent: enterpriseName,
    });

    const tokens = response.data.enrollmentTokens || [];
    
    if (tokens.length === 0) {
      console.log('📭 No enrollment tokens found.');
      return;
    }
    
    console.log(`\n📋 Found ${tokens.length} enrollment token(s):`);
    console.log('-'.repeat(60));
    
    tokens.forEach((token, index) => {
      console.log(`${index + 1}. Token Details:`);
      console.log(`   Name: ${token.name}`);
      console.log(`   Value: ${token.value}`);
      console.log(`   Expires: ${token.expirationTimestamp}`);
      console.log(`   Policy: ${token.policyName}`);
      console.log('-'.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Error listing enrollment tokens:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Main execution
async function main() {
  console.log('🔐 Android Enterprise Enrollment Token Generator');
  console.log('='.repeat(50));
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'create') {
    await createEnrollmentToken();
  } else if (command === 'list') {
    await listExistingTokens();
  } else {
    console.log('\n📖 Usage:');
    console.log('  node generate-enrollment-token.cjs create  - Create new token');
    console.log('  node generate-enrollment-token.cjs list    - List existing tokens');
    console.log('\n💡 Example:');
    console.log('  node generate-enrollment-token.cjs create');
  }
}

main().catch(console.error);

