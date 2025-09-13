const { google } = require('googleapis');
const fs = require('fs');

async function testEnterprise() {
  try {
    console.log('🔍 Testing Enterprise ID...');
    
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

    // Read enterprise ID from .env
    const envContent = fs.readFileSync('.env', 'utf8');
    const enterpriseIdMatch = envContent.match(/ENTERPRISE_ID=(.+)/);
    const enterpriseId = enterpriseIdMatch ? enterpriseIdMatch[1].trim() : null;
    
    if (!enterpriseId) {
      console.log('❌ No ENTERPRISE_ID found in .env file');
      return;
    }

    console.log(`🔍 Testing enterprise ID: ${enterpriseId}`);
    const enterpriseName = `enterprises/${enterpriseId}`;

    // Try to get enterprise details
    try {
      console.log('🔍 Getting enterprise details...');
      const response = await service.enterprises.get({
        name: enterpriseName,
      });
      
      console.log('✅ Enterprise found!');
      console.log(`📋 Enterprise Name: ${response.data.name}`);
      console.log(`📋 Display Name: ${response.data.displayName || 'N/A'}`);
      console.log(`📋 Contact Email: ${response.data.contactInfo?.contactEmail || 'N/A'}`);
      
    } catch (error) {
      console.log('❌ Enterprise not found or access denied');
      console.log(`Error: ${error.message}`);
      
      if (error.message.includes('NOT_FOUND')) {
        console.log('💡 This enterprise ID does not exist. You may need to:');
        console.log('   1. Create a new enterprise in Android Management Console');
        console.log('   2. Use a different enterprise ID');
        console.log('   3. Check if you have the correct permissions');
      } else if (error.message.includes('PERMISSION_DENIED')) {
        console.log('💡 Permission denied. Make sure your service account has:');
        console.log('   1. Android Management User role');
        console.log('   2. Access to this specific enterprise');
      }
    }

    // Try to list devices to see if we can access the enterprise
    try {
      console.log('🔍 Testing device access...');
      const devicesResponse = await service.enterprises.devices.list({
        parent: enterpriseName,
      });
      
      console.log('✅ Device access successful!');
      console.log(`📱 Found ${devicesResponse.data.devices?.length || 0} devices`);
      
    } catch (error) {
      console.log('❌ Cannot access devices');
      console.log(`Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testEnterprise();









