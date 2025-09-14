// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate the SHA-256 signature checksum of an APK file
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
    
    // Get file stats
    const stats = fs.statSync(apkPath);
    
    return {
      checksum,
      filePath: apkPath,
      fileSize: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
  } catch (error) {
    logger.error('Error calculating signature checksum:', error);
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
 * Generate a complete provisioning payload with the calculated checksum
 */
async function generateProvisioningPayload() {
  try {
    const checksumResult = await calculateMDMDPCChecksum();
    
    const payload = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.mdm.dpc/.DeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://poetic-llama-889a15.netlify.app/public/downloads/mdm-dpc-app.apk",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": checksumResult.checksum,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
      "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "GCXMHNJPILLPRZGKRLWF"
    };
    
    return {
      checksum: checksumResult.checksum,
      payload,
      fileInfo: {
        path: checksumResult.filePath,
        size: checksumResult.fileSize,
        lastModified: checksumResult.lastModified
      }
    };
  } catch (error) {
    logger.error('Error generating provisioning payload:', error);
    throw error;
  }
}

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters } = event;
    
    if (httpMethod === 'GET') {
      const { type = 'checksum' } = queryStringParameters || {};
      
      switch (type) {
        case 'checksum':
          // GET /api/checksum?type=checksum - Get just the checksum
          const checksumResult = await calculateMDMDPCChecksum();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: {
                checksum: checksumResult.checksum,
                filePath: checksumResult.filePath,
                fileSize: checksumResult.fileSize,
                lastModified: checksumResult.lastModified
              },
              message: 'Signature checksum calculated successfully'
            }),
          };
          
        case 'payload':
          // GET /api/checksum?type=payload - Get complete provisioning payload
          const payloadResult = await generateProvisioningPayload();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: payloadResult,
              message: 'Provisioning payload generated successfully'
            }),
          };
          
        case 'verify':
          // GET /api/checksum?type=verify&checksum=xxx - Verify a checksum
          const { checksum } = queryStringParameters || {};
          if (!checksum) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Checksum parameter is required for verification'
              }),
            };
          }
          
          const verifyResult = await calculateMDMDPCChecksum();
          const isValid = verifyResult.checksum.toLowerCase() === checksum.toLowerCase();
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: {
                isValid,
                expected: checksum,
                actual: verifyResult.checksum,
                match: isValid
              },
              message: `Checksum verification: ${isValid ? 'VALID' : 'INVALID'}`
            }),
          };
          
        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Invalid type parameter. Use: checksum, payload, or verify'
            }),
          };
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use GET method.'
        }),
      };
    }
  } catch (error) {
    logger.error('Error in checksum function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
    };
  }
};
