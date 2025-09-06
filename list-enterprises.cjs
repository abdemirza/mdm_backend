const { google } = require('googleapis');

async function listEnterprises() {
  try {
    console.log('🔍 Listing enterprises...');
    
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

    // Try different approaches to list enterprises
    console.log('🔍 Method 1: List enterprises with project ID...');
    try {
      const response = await service.enterprises.list({
        projectId: 'track-movements'
      });
      
      console.log('📋 Available enterprises:');
      if (response.data.enterprises && response.data.enterprises.length > 0) {
        response.data.enterprises.forEach(enterprise => {
          console.log(`- Name: ${enterprise.name}`);
          console.log(`  Display Name: ${enterprise.displayName || 'N/A'}`);
          console.log(`  Enterprise ID: ${enterprise.name.split('/')[1]}`);
          console.log('---');
        });
      } else {
        console.log('❌ No enterprises found.');
      }
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
    }

    // Try without project ID
    console.log('🔍 Method 2: List enterprises without project ID...');
    try {
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
        console.log('❌ No enterprises found.');
      }
    } catch (error) {
      console.log(`❌ Method 2 failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

listEnterprises();





