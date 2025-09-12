const { google } = require('googleapis');
const fs = require('fs');

async function testConnection() {
  try {
    console.log('🔍 Testing Google Cloud connection...');
    
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

    // Try to list enterprises
    console.log('🔍 Listing enterprises...');
    const response = await service.enterprises.list();
    
    console.log('📋 Available enterprises:');
    if (response.data.enterprises && response.data.enterprises.length > 0) {
      response.data.enterprises.forEach(enterprise => {
        console.log(`- Name: ${enterprise.name}`);
        console.log(`  Display Name: ${enterprise.displayName || 'N/A'}`);
        console.log(`  Enterprise ID: ${enterprise.name.split('/')[1]}`);
        console.log('---');
      });
    } else {
      console.log('❌ No enterprises found. You may need to create an enterprise first.');
      console.log('Visit: https://developers.google.com/android/management/quickstart');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Make sure your service account has the "Android Management User" role');
    }
  }
}

testConnection();







