const { google } = require('googleapis');

async function testUserFacingMessage() {
  try {
    console.log('🔍 Testing UserFacingMessage structure...');
    
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
    
    // Test UserFacingMessage structure
    const userFacingMessageTests = [
      {
        name: 'UserFacingMessage with defaultMessage',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            lostMessage: {
              defaultMessage: 'This device has been reported as lost. Please contact the owner immediately.'
            }
          }
        }
      },
      {
        name: 'UserFacingMessage with localizedMessage',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            lostMessage: {
              defaultMessage: 'This device has been reported as lost. Please contact the owner immediately.',
              localizedMessage: {
                'en': 'This device has been reported as lost. Please contact the owner immediately.'
              }
            }
          }
        }
      },
      {
        name: 'Minimal UserFacingMessage',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            lostMessage: {
              defaultMessage: 'Lost device'
            }
          }
        }
      }
    ];

    for (const test of userFacingMessageTests) {
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

testUserFacingMessage();














