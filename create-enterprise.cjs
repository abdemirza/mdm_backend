const { google } = require('googleapis');
const fs = require('fs');

async function createEnterprise() {
  try {
    console.log('🔍 Creating new enterprise...');
    
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

    // Create enterprise
    const enterpriseData = {
      enterpriseDisplayName: 'My MDM Enterprise',
      contactInfo: {
        contactEmail: 'admin@example.com', // Replace with your email
      },
      enabledNotificationTypes: ['ENROLLMENT', 'COMPLIANCE_REPORT', 'STATUS_REPORT'],
    };

    console.log('🔍 Creating enterprise...');
    const response = await service.enterprises.create({
      projectId: 'track-movements',
      requestBody: enterpriseData,
    });

    console.log('✅ Enterprise created successfully!');
    console.log(`📋 Enterprise Name: ${response.data.name}`);
    console.log(`📋 Enterprise ID: ${response.data.name.split('/')[1]}`);
    console.log(`📋 Display Name: ${response.data.displayName}`);
    
    // Update .env file with the new enterprise ID
    const enterpriseId = response.data.name.split('/')[1];
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnv = envContent.replace(
      /ENTERPRISE_ID=.*/,
      `ENTERPRISE_ID=${enterpriseId}`
    );
    fs.writeFileSync('.env', updatedEnv);
    
    console.log('✅ Updated .env file with new enterprise ID');
    console.log('🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('❌ Error creating enterprise:', error.message);
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Permission denied. Make sure your service account has:');
      console.log('   1. Android Management User role');
      console.log('   2. Project Editor or Owner role');
    } else if (error.message.includes('ALREADY_EXISTS')) {
      console.log('💡 Enterprise already exists. Try listing enterprises instead.');
    }
  }
}

createEnterprise();
