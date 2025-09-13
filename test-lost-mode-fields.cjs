const { google } = require('googleapis');

async function testLostModeFields() {
  try {
    console.log('🔍 Testing Lost Mode field names...');
    
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
    
    // Test different field name variations
    const fieldVariations = [
      {
        name: 'snake_case fields',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            message: 'Lost device message',
            phone_number: '+1-555-123-4567',
            email: 'owner@company.com'
          }
        }
      },
      {
        name: 'different param structure',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            lost_mode_message: 'Lost device message',
            contact_phone: '+1-555-123-4567',
            contact_email: 'owner@company.com'
          }
        }
      },
      {
        name: 'minimal params',
        command: {
          type: 'START_LOST_MODE',
          startLostModeParams: {
            message: 'Lost device message'
          }
        }
      },
      {
        name: 'with params object',
        command: {
          type: 'START_LOST_MODE',
          params: {
            message: 'Lost device message',
            phoneNumber: '+1-555-123-4567',
            email: 'owner@company.com'
          }
        }
      }
    ];

    for (const variation of fieldVariations) {
      try {
        console.log(`\n🔍 Testing ${variation.name}:`);
        console.log('Command:', JSON.stringify(variation.command, null, 2));
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: variation.command,
        });
        
        console.log(`✅ ${variation.name} worked!`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        break; // Stop after first successful command
        
      } catch (error) {
        console.log(`❌ ${variation.name} failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testLostModeFields();








