const { google } = require('googleapis');

async function testAlternativeLockCommands() {
  try {
    console.log('🔍 Testing alternative lock commands...');
    
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
    
    // Test different lock commands
    const lockCommands = [
      {
        name: 'LOCK command with duration',
        command: {
          type: 'LOCK',
          duration: '3600s' // 1 hour
        }
      },
      {
        name: 'LOCK command with message',
        command: {
          type: 'LOCK',
          duration: '3600s',
          lostMessage: {
            defaultMessage: 'This device has been locked. Please contact the administrator.'
          }
        }
      },
      {
        name: 'REBOOT command (to clear any existing locks)',
        command: {
          type: 'REBOOT'
        }
      }
    ];

    for (const test of lockCommands) {
      try {
        console.log(`\n🔍 Testing ${test.name}:`);
        console.log('Command:', JSON.stringify(test.command, null, 2));
        
        const response = await service.enterprises.devices.issueCommand({
          name: deviceName,
          requestBody: test.command,
        });
        
        console.log(`✅ ${test.name} worked!`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Wait a bit between commands
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ ${test.name} failed:`, error.message);
      }
    }

    // Check device state after commands
    console.log('\n📱 Checking device state after commands...');
    const device = await service.enterprises.devices.get({
      name: deviceName,
    });
    
    console.log('Current State:', device.data.state);
    console.log('Applied State:', device.data.appliedState);
    console.log('Last Status Report Time:', device.data.lastStatusReportTime);

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testAlternativeLockCommands();









