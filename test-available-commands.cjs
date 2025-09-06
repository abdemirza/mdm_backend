const { google } = require('googleapis');

async function testAvailableCommands() {
  try {
    console.log('🔍 Testing available command types...');
    
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
    
    // Test different command types that might work for wiping
    const commands = [
      { type: 'WIPE' },
      { type: 'WIPE_DATA' },
      { type: 'FACTORY_RESET' },
      { type: 'RESET_PASSWORD' },
      { type: 'REBOOT' },
      { type: 'LOCK' }
    ];

    for (const cmd of commands) {
      try {
        console.log(`\n🔍 Testing command type: ${cmd.type}`);
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: cmd,
        });
        
        console.log(`✅ ${cmd.type} command is valid!`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        console.log(`❌ ${cmd.type} failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testAvailableCommands();