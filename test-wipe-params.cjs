const { google } = require('googleapis');

async function testWipeParams() {
  try {
    console.log('🔍 Testing wipe command with correct parameters...');
    
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
    
    // Test WIPE command with correct parameter structure
    const wipeCommands = [
      {
        name: 'WIPE with wipeDataParams',
        command: {
          type: 'WIPE',
          wipeDataParams: {
            wipeData: true
          }
        }
      },
      {
        name: 'WIPE with wipeDataParams and wipeExternalStorage',
        command: {
          type: 'WIPE',
          wipeDataParams: {
            wipeData: true,
            wipeExternalStorage: true
          }
        }
      },
      {
        name: 'WIPE with wipeDataParams and preserveFrp',
        command: {
          type: 'WIPE',
          wipeDataParams: {
            wipeData: true,
            preserveFrp: true
          }
        }
      },
      {
        name: 'WIPE with all options',
        command: {
          type: 'WIPE',
          wipeDataParams: {
            wipeData: true,
            wipeExternalStorage: true,
            preserveFrp: true
          }
        }
      }
    ];

    for (const test of wipeCommands) {
      try {
        console.log(`\n🔍 Testing ${test.name}:`);
        console.log('Command:', JSON.stringify(test.command, null, 2));
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: test.command,
        });
        
        console.log(`✅ ${test.name} worked!`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        break; // Stop after first successful command
        
      } catch (error) {
        console.log(`❌ ${test.name} failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testWipeParams();









