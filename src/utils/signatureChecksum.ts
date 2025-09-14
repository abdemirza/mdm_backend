import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger.js';

export interface ChecksumResult {
  checksum: string;
  filePath: string;
  fileSize: number;
  lastModified: string;
}

export interface ProvisioningPayload {
  'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME': string;
  'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION': string;
  'android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM': string;
  'android.app.extra.PROVISIONING_SKIP_ENCRYPTION': boolean;
  'android.app.extra.PROVISIONING_ENROLLMENT_TOKEN': string;
}

/**
 * Calculate the SHA-256 signature checksum of an APK file
 * This is used for PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM in Android provisioning
 * 
 * @param apkPath - Path to the APK file
 * @returns Promise<ChecksumResult> - Checksum result with file information
 */
export async function calculateSignatureChecksum(apkPath: string): Promise<ChecksumResult> {
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
    
    // Get file stats
    const stats = fs.statSync(apkPath);
    
    const result: ChecksumResult = {
      checksum,
      filePath: apkPath,
      fileSize: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
    
    logger.info(`Calculated signature checksum for ${apkPath}: ${checksum}`);
    
    return result;
  } catch (error) {
    logger.error('Error calculating signature checksum:', error);
    throw error;
  }
}

/**
 * Calculate signature checksum for the MDM DPC app
 * Searches common locations for the APK file
 */
export async function calculateMDMDPCChecksum(): Promise<ChecksumResult> {
  const apkPaths = [
    './public/downloads/mdm-dpc-app.apk',
    './downloads/mdm-dpc-app.apk',
    './mdm-dpc-app.apk',
    './netlify/functions/mdm-dpc-app.apk'
  ];

  for (const apkPath of apkPaths) {
    try {
      if (fs.existsSync(apkPath)) {
        logger.info(`Found MDM DPC APK file: ${apkPath}`);
        return await calculateSignatureChecksum(apkPath);
      }
    } catch (error) {
      logger.error(`Error processing ${apkPath}:`, error);
    }
  }
  
  throw new Error('MDM DPC APK file not found in any of the expected locations');
}

/**
 * Verify checksum against a known value
 * @param apkPath - Path to APK file
 * @param expectedChecksum - Expected checksum to verify against
 */
export async function verifyChecksum(apkPath: string, expectedChecksum: string): Promise<boolean> {
  try {
    const result = await calculateSignatureChecksum(apkPath);
    const isValid = result.checksum.toLowerCase() === expectedChecksum.toLowerCase();
    
    logger.info(`Checksum verification for ${apkPath}: ${isValid ? 'VALID' : 'INVALID'}`);
    logger.info(`Expected: ${expectedChecksum}`);
    logger.info(`Actual: ${result.checksum}`);
    
    return isValid;
  } catch (error) {
    logger.error('Error verifying checksum:', error);
    return false;
  }
}

/**
 * Generate a complete provisioning payload with the calculated checksum
 */
export async function generateProvisioningPayload(): Promise<ProvisioningPayload> {
  try {
    const checksumResult = await calculateMDMDPCChecksum();
    
    const payload: ProvisioningPayload = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.mdm.dpc/.DeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://poetic-llama-889a15.netlify.app/public/downloads/mdm-dpc-app.apk",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": checksumResult.checksum,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
      "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "GCXMHNJPILLPRZGKRLWF"
    };
    
    logger.info('Generated provisioning payload with signature checksum');
    
    return payload;
  } catch (error) {
    logger.error('Error generating provisioning payload:', error);
    throw error;
  }
}

/**
 * Get the current signature checksum for the MDM DPC app
 * This is a convenience function that returns just the checksum string
 */
export async function getMDMDPCSignatureChecksum(): Promise<string> {
  const result = await calculateMDMDPCChecksum();
  return result.checksum;
}

/**
 * Format checksum result for display
 */
export function formatChecksumResult(result: ChecksumResult): string {
  const fileSizeMB = (result.fileSize / 1024 / 1024).toFixed(2);
  
  return `
🔐 MDM DPC App Signature Checksum
============================================================
📁 APK File: ${result.filePath}
🔑 SHA-256 Checksum: ${result.checksum}
📏 Checksum Length: ${result.checksum.length} characters
📊 File Size: ${fileSizeMB} MB
📅 Last Modified: ${result.lastModified}
============================================================
`;
}
