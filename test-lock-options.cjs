const { google } = require('googleapis');

async function testLockOptions() {
  try {
    console.log('🔍 Testing different lock options...');
    
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
    
    // Different lock options
    const lockOptions = [
      {
        name: 'Temporary Lock (2 minutes)',
        command: {
          type: 'LOCK',
          duration: '120s'
        }
      },
      {
        name: 'Long Lock (1 hour)',
        command: {
          type: 'LOCK',
          duration: '3600s'
        }
      },
      {
        name: 'Very Long Lock (24 hours)',
        command: {
          type: 'LOCK',
          duration: '86400s'
        }
      },
      {
        name: 'Permanent Lock (until manually unlocked)',
        command: {
          type: 'LOCK'
          // No duration = permanent until unlocked
        }
      }
    ];

    console.log('\n📋 Available Lock Options:');
    lockOptions.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`);
      console.log(`   Command: ${JSON.stringify(option.command)}`);
      console.log('');
    });

    // Test the permanent lock option
    console.log('🔒 Testing PERMANENT LOCK (no duration)...');
    try {
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: {
          type: 'LOCK'
          // No duration specified = permanent lock
        },
      });
      
      console.log('✅ Permanent lock command issued successfully!');
      console.log('📱 Device will be locked until manually unlocked');
      console.log('🔑 To unlock, you need to issue an UNLOCK command or use device admin');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Permanent lock failed:', error.message);
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testLockOptions();








