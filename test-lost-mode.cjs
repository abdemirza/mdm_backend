const { google } = require('googleapis');

async function testLostMode() {
  try {
    console.log('🔍 Testing Lost Mode functionality...');
    
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
    
    // Test Lost Mode command
    console.log('🔒 Testing LOST_MODE command...');
    try {
      const lostModeCommand = {
        type: 'LOST_MODE',
        message: 'This device has been reported as lost. Please contact the owner immediately.',
        phoneNumber: '+1-555-123-4567',
        email: 'owner@company.com'
      };
      
      console.log('📱 Lost Mode Command:', JSON.stringify(lostModeCommand, null, 2));
      
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: lostModeCommand,
      });
      
      console.log('✅ Lost Mode command issued successfully!');
      console.log('📱 Device will display the lost message and contact info');
      console.log('🔑 Device will be locked and unusable until lost mode is disabled');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Lost Mode command failed:', error.message);
    }

    // Wait a moment, then test Exit Lost Mode
    console.log('\n⏳ Waiting 3 seconds before testing Exit Lost Mode...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔓 Testing EXIT_LOST_MODE command...');
    try {
      const exitLostModeCommand = {
        type: 'EXIT_LOST_MODE'
      };
      
      console.log('📱 Exit Lost Mode Command:', JSON.stringify(exitLostModeCommand, null, 2));
      
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: exitLostModeCommand,
      });
      
      console.log('✅ Exit Lost Mode command issued successfully!');
      console.log('📱 Device will exit lost mode and become usable again');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Exit Lost Mode command failed:', error.message);
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testLostMode();













