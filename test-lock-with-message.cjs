const { google } = require('googleapis');

async function testLockWithMessage() {
  try {
    console.log('🔍 Testing Lock with message functionality...');
    
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
    
    // Test different lock approaches for "lost mode"
    const lockOptions = [
      {
        name: 'Very Long Lock (24 hours)',
        command: {
          type: 'LOCK',
          duration: '86400s' // 24 hours
        }
      },
      {
        name: 'Extremely Long Lock (7 days)',
        command: {
          type: 'LOCK',
          duration: '604800s' // 7 days
        }
      },
      {
        name: 'Maximum Lock (30 days)',
        command: {
          type: 'LOCK',
          duration: '2592000s' // 30 days
        }
      }
    ];

    console.log('📋 Available "Lost Mode" Lock Options:');
    lockOptions.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`);
      console.log(`   Duration: ${option.command.duration} seconds`);
      console.log(`   Command: ${JSON.stringify(option.command)}`);
      console.log('');
    });

    // Test the 24-hour lock as a "lost mode" simulation
    console.log('🔒 Testing 24-hour lock as "Lost Mode"...');
    try {
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: {
          type: 'LOCK',
          duration: '86400s' // 24 hours
        },
      });
      
      console.log('✅ 24-hour lock command issued successfully!');
      console.log('📱 Device will be locked for 24 hours (simulating lost mode)');
      console.log('🔑 Device will be unusable until manually unlocked or duration expires');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ 24-hour lock failed:', error.message);
    }

    console.log('\n💡 Note: For true "lost mode" with custom messages, you would need to:');
    console.log('1. Use device policies to set lock screen messages');
    console.log('2. Use the LOCK command with very long duration');
    console.log('3. Potentially use device location tracking features');
    console.log('4. Set up custom lock screen widgets or notifications');

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testLockWithMessage();







