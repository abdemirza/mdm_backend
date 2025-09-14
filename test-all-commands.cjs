const { google } = require('googleapis');

async function testAllCommands() {
  try {
    console.log('🔍 Testing all possible command types...');
    
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
    
    // Test all possible command types
    const commandTypes = [
      'LOCK',
      'UNLOCK', 
      'REBOOT',
      'WIPE_DATA',
      'CLEAR_APP_DATA',
      'INSTALL_APP',
      'UNINSTALL_APP',
      'RESET_PASSWORD',
      'SET_WALLPAPER',
      'START_LOST_MODE',
      'STOP_LOST_MODE',
      'ENABLE_LOST_MODE',
      'DISABLE_LOST_MODE',
      'LOST_MODE',
      'EXIT_LOST_MODE',
      'REMOTE_LOCK',
      'REMOTE_WIPE',
      'FACTORY_RESET',
      'CLEAR_DEVICE_DATA'
    ];

    console.log('📋 Testing command types:');
    const validCommands = [];
    const invalidCommands = [];
    
    for (const commandType of commandTypes) {
      try {
        console.log(`\n🔍 Testing: ${commandType}`);
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: {
            type: commandType
          },
        });
        
        console.log(`✅ ${commandType} is VALID!`);
        validCommands.push(commandType);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        if (error.message.includes('Invalid value at \'command.type\'')) {
          console.log(`❌ ${commandType} is INVALID`);
          invalidCommands.push(commandType);
        } else {
          console.log(`⚠️  ${commandType} failed with different error:`, error.message);
          // This might be a valid command but with wrong parameters
          validCommands.push(commandType);
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('✅ Valid Commands:', validCommands);
    console.log('❌ Invalid Commands:', invalidCommands);

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testAllCommands();










