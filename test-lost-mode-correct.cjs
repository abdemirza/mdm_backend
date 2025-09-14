const { google } = require('googleapis');

async function testLostModeCorrect() {
  try {
    console.log('🔍 Testing correct Lost Mode command structure...');
    
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
    
    // Test the correct START_LOST_MODE command structure
    console.log('🔒 Testing START_LOST_MODE with correct structure...');
    try {
      const lostModeCommand = {
        type: 'START_LOST_MODE',
        startLostModeParams: {
          message: 'This device has been reported as lost. Please contact the owner immediately.',
          phoneNumber: '+1-555-123-4567',
          email: 'owner@company.com'
        }
      };
      
      console.log('📱 Lost Mode Command:', JSON.stringify(lostModeCommand, null, 2));
      
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: lostModeCommand,
      });
      
      console.log('✅ Lost Mode command issued successfully!');
      console.log('📱 Device will display the lost message and contact info');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Lost Mode command failed:', error.message);
    }

    // Wait a moment, then test STOP_LOST_MODE
    console.log('\n⏳ Waiting 3 seconds before testing STOP_LOST_MODE...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔓 Testing STOP_LOST_MODE command...');
    try {
      const stopLostModeCommand = {
        type: 'STOP_LOST_MODE'
      };
      
      console.log('📱 Stop Lost Mode Command:', JSON.stringify(stopLostModeCommand, null, 2));
      
      const response = await service.enterprises.devices.issueCommand({
        name: deviceName,
        requestBody: stopLostModeCommand,
      });
      
      console.log('✅ Stop Lost Mode command issued successfully!');
      console.log('📱 Device will exit lost mode');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Stop Lost Mode command failed:', error.message);
    }

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testLostModeCorrect();










