// Debug Firebase Configuration
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Check environment variables
    const config = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT_SET',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? 'SET' : 'NOT_SET',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET' : 'NOT_SET',
    };

    // Check private key format
    const privateKeyInfo = {
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      startsWithBegin: process.env.FIREBASE_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----') || false,
      endsWithEnd: process.env.FIREBASE_PRIVATE_KEY?.endsWith('-----END PRIVATE KEY-----') || false,
      hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false,
    };

    // Test JWT creation
    let jwtTest = null;
    try {
      const jwt = await createTestJWT();
      jwtTest = {
        success: true,
        jwtLength: jwt.length,
        jwtPreview: jwt.substring(0, 50) + '...'
      };
    } catch (error) {
      jwtTest = {
        success: false,
        error: error.message
      };
    }

    // Test OAuth2 token request
    let oauthTest = null;
    try {
      const accessToken = await getTestAccessToken();
      oauthTest = {
        success: true,
        tokenLength: accessToken.length,
        tokenPreview: accessToken.substring(0, 20) + '...'
      };
    } catch (error) {
      oauthTest = {
        success: false,
        error: error.message
      };
    }

    // Test Firestore connection
    let firestoreTest = null;
    try {
      const result = await testFirestoreConnection();
      firestoreTest = {
        success: true,
        result: result
      };
    } catch (error) {
      firestoreTest = {
        success: false,
        error: error.message
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          environment: config,
          privateKey: privateKeyInfo,
          jwtTest,
          oauthTest,
          firestoreTest
        },
        message: 'Firebase configuration debug complete'
      }),
    };
  } catch (error) {
    logger.error('Error in debug function:', error);
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

async function createTestJWT() {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsignedToken = Buffer.from(JSON.stringify(header)).toString('base64url') + '.' + 
                       Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const crypto = await import('crypto');
  
  // Format the private key properly for Node.js crypto
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  
  const signature = sign.sign(privateKey, 'base64url');
  return `${unsignedToken}.${signature}`;
}

async function getTestAccessToken() {
  const jwt = await createTestJWT();
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function testFirestoreConnection() {
  const accessToken = await getTestAccessToken();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  // Test simple Firestore request
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore request failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
