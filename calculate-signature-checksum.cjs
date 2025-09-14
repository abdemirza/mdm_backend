const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Calculate the SHA-256 signature checksum of an APK file
 * This is used for PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM in Android provisioning
 * 
 * @param {string} apkPath - Path to the APK file
 * @returns {Promise<string>} - SHA-256 checksum in hex format
 */
async function calculateSignatureChecksum(apkPath) {
  try {
    // Check if file exists
    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK file not found: ${apkPath}`);
    }

    // Read the APK file
    const apkBuffer = fs.readFileSync(apkPath);
    
    // Calculate SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(apkBuffer);
    const checksum = hash.digest('hex');
    
    return checksum;
  } catch (error) {
    console.error('Error calculating signature checksum:', error);
    throw error;
  }
}

/**
 * Calculate signature checksum for the MDM DPC app
 */
async function calculateMDMDPCChecksum() {
  const apkPaths = [
    './public/downloads/mdm-dpc-app.apk',
    './downloads/mdm-dpc-app.apk',
    './mdm-dpc-app.apk'
  ];

  for (const apkPath of apkPaths) {
    try {
      if (fs.existsSync(apkPath)) {
        console.log(`📱 Found APK file: ${apkPath}`);
        
        const checksum = await calculateSignatureChecksum(apkPath);
        
        console.log('=' .repeat(60));
        console.log('🔐 MDM DPC App Signature Checksum');
        console.log('=' .repeat(60));
        console.log(`📁 APK File: ${apkPath}`);
        console.log(`🔑 SHA-256 Checksum: ${checksum}`);
        console.log(`📏 Checksum Length: ${checksum.length} characters`);
        console.log('=' .repeat(60));
        
        // Display in different formats
        console.log('\n📋 For Provisioning Payload:');
        console.log(`"PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "${checksum}"`);
        
        console.log('\n📋 For QR Code Generation:');
        console.log(`"android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "${checksum}"`);
        
        // Get file info
        const stats = fs.statSync(apkPath);
        console.log(`\n📊 File Information:`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Modified: ${stats.mtime.toISOString()}`);
        
        return checksum;
      }
    } catch (error) {
      console.error(`Error processing ${apkPath}:`, error.message);
    }
  }
  
  throw new Error('MDM DPC APK file not found in any of the expected locations');
}

/**
 * Verify checksum against a known value
 * @param {string} apkPath - Path to APK file
 * @param {string} expectedChecksum - Expected checksum to verify against
 */
async function verifyChecksum(apkPath, expectedChecksum) {
  try {
    const actualChecksum = await calculateSignatureChecksum(apkPath);
    const isValid = actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
    
    console.log('🔍 Checksum Verification:');
    console.log(`   Expected: ${expectedChecksum}`);
    console.log(`   Actual:   ${actualChecksum}`);
    console.log(`   Valid:    ${isValid ? '✅ YES' : '❌ NO'}`);
    
    return isValid;
  } catch (error) {
    console.error('Error verifying checksum:', error);
    return false;
  }
}

/**
 * Generate a complete provisioning payload with the calculated checksum
 */
async function generateProvisioningPayload() {
  try {
    const checksum = await calculateMDMDPCChecksum();
    
    const payload = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.mdm.dpc/.DeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://poetic-llama-889a15.netlify.app/public/downloads/mdm-dpc-app.apk",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": checksum,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
      "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "GCXMHNJPILLPRZGKRLWF"
    };
    
    console.log('\n🎯 Complete Provisioning Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    return payload;
  } catch (error) {
    console.error('Error generating provisioning payload:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting MDM DPC App Signature Checksum Calculation...\n');
    
    await generateProvisioningPayload();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  calculateSignatureChecksum,
  calculateMDMDPCChecksum,
  verifyChecksum,
  generateProvisioningPayload
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}
