#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 MDM Backend Environment Setup\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📝 Current .env contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  process.exit(0);
}

// Check for service account key
const keyFiles = ['mdm_server_key.json', 'service-account-key.json'];
let foundKeyFile = null;

for (const keyFile of keyFiles) {
  const keyPath = path.join(__dirname, keyFile);
  if (fs.existsSync(keyPath)) {
    foundKeyFile = keyFile;
    break;
  }
}

if (!foundKeyFile) {
  console.log('❌ No service account key file found!');
  console.log('Please download your service account key from Google Cloud Console');
  console.log('and place it in the project root as "mdm_server_key.json"');
  process.exit(1);
}

console.log(`✅ Found service account key: ${foundKeyFile}`);

// Create .env file
const envContent = `# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=${foundKeyFile}
ENTERPRISE_ID=your_enterprise_id

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env file');
console.log('📝 Please update ENTERPRISE_ID in .env with your actual enterprise ID');
console.log('🚀 You can now run: npm run dev');
