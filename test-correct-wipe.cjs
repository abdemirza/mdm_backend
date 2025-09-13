const { google } = require('googleapis');

async function testCorrectWipe() {
  try {
    console.log('🔍 Testing correct wipe command...');
    
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

    const deviceName = 'enterprises/LC048psd8h/devices/36b94e49cf4e18b9';
    
    // Test the correct WIPE command structure
    const wipeCommand = {
      type: 'WIPE',
      wipeDataParams: {
        wipeData: true,
        wipeExternalStorage: false,
        preserveFrp: false
      }
    };

    console.log('Command:', JSON.stringify(wipeCommand, null, 2));
    
    const response = await service.enterprises.devices.issueCommand({
      name: deviceName,
      requestBody: wipeCommand,
    });
    
    console.log('✅ WIPE command worked!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If that doesn't work, try without parameters
    try {
      console.log('\n🔍 Trying WIPE without parameters...');
      const simpleWipeCommand = {
        type: 'WIPE'
      };
      
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: simpleWipeCommand,
      });
      
      console.log('✅ Simple WIPE command worked!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error2) {
      console.error('❌ Simple WIPE also failed:', error2.message);
    }
  }
}

testCorrectWipe();








