const { google } = require('googleapis');

async function testDeviceStatus() {
  try {
    console.log('🔍 Checking device status and available commands...');
    
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
    
    // Get device details
    console.log('\n📱 Device Details:');
    const device = await service.enterprises.devices.get({
      name: deviceName,
    });
    
    console.log('Device Name:', device.data.name);
    console.log('State:', device.data.state);
    console.log('Applied State:', device.data.appliedState);
    console.log('Management Mode:', device.data.managementMode);
    console.log('Policy Name:', device.data.policyName);
    console.log('Applied Policy Name:', device.data.appliedPolicyName);
    console.log('Enrollment Time:', device.data.enrollmentTime);
    console.log('Last Status Report Time:', device.data.lastStatusReportTime);
    
    // Check if device is compliant
    console.log('\n🔒 Compliance Status:');
    if (device.data.complianceState) {
      console.log('Compliance State:', device.data.complianceState);
    }
    
    // Check device hardware info
    console.log('\n🔧 Hardware Info:');
    if (device.data.hardwareInfo) {
      console.log('Model:', device.data.hardwareInfo.model);
      console.log('Manufacturer:', device.data.hardwareInfo.manufacturer);
      console.log('Device Type:', device.data.hardwareInfo.deviceType);
    }
    
    // Check if there are any pending operations
    console.log('\n⏳ Checking for pending operations...');
    const operations = await service.enterprises.devices.operations.list({
      name: deviceName,
      pageSize: 10,
    });
    
    if (operations.data.operations && operations.data.operations.length > 0) {
      console.log('Pending Operations:');
      operations.data.operations.forEach((op, index) => {
        console.log(`${index + 1}. ${op.name} - ${op.metadata?.type} - Done: ${op.done}`);
        if (op.metadata) {
          console.log(`   Created: ${op.metadata.createTime}`);
          console.log(`   Duration: ${op.metadata.duration}`);
        }
      });
    } else {
      console.log('No pending operations found.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeviceStatus();








