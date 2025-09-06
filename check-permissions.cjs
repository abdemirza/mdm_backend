const { google } = require('googleapis');

async function checkPermissions() {
  try {
    console.log('🔍 Checking service account permissions...');
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: './mdm_server_key.json',
      scopes: ['https://www.googleapis.com/auth/androidmanagement'],
    });

    const client = await auth.getClient();
    
    // Get project info
    const service = google.androidmanagement({
      version: 'v1',
      auth: client,
    });

    console.log('✅ Authentication successful');
    console.log('📋 Service Account Email:', client.email);
    console.log('📋 Project ID: track-movements');
    
    // Try to get project info
    try {
      const projectService = google.cloudresourcemanager({
        version: 'v1',
        auth: client,
      });
      
      const project = await projectService.projects.get({
        projectId: 'track-movements'
      });
      
      console.log('✅ Project access successful');
      console.log('📋 Project Name:', project.data.name);
      console.log('📋 Project Number:', project.data.projectNumber);
      
    } catch (error) {
      console.log('❌ Cannot access project info:', error.message);
    }

    console.log('\n💡 To fix permission issues:');
    console.log('1. Go to: https://console.cloud.google.com/iam-admin/iam?project=track-movements');
    console.log('2. Find your service account: lock-app@track-movements.iam.gserviceaccount.com');
    console.log('3. Add these roles:');
    console.log('   - Android Management User');
    console.log('   - Project Editor (or at least Project Viewer)');
    console.log('4. Wait a few minutes for permissions to propagate');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPermissions();





