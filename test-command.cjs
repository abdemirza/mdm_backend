const { google } = require('googleapis');

async function testCommand() {
  try {
    console.log('🔍 Testing command format...');
    
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
    
    // Test different command formats
    const commandFormats = [
      // Format 1: Direct command object
      {
        type: 'LOCK',
        duration: '120s'
      },
      // Format 2: Wrapped in command
      {
        command: {
          type: 'LOCK',
          duration: '120s'
        }
      },
      // Format 3: With different structure
      {
        type: 'LOCK',
        duration: '120s',
        reason: 'Test lock command'
      }
    ];

    for (let i = 0; i < commandFormats.length; i++) {
      try {
        console.log(`\n🔍 Testing format ${i + 1}:`, JSON.stringify(commandFormats[i], null, 2));
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: commandFormats[i],
        });
        
        console.log('✅ Format', i + 1, 'worked!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        break;
        
      } catch (error) {
        console.log(`❌ Format ${i + 1} failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testCommand();





