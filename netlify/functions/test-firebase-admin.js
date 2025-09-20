// Test Firebase Admin SDK Installation
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
    // Test Firebase Admin SDK import
    let firebaseAdminTest = null;
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      firebaseAdminTest = {
        success: true,
        message: 'Firebase Admin SDK imported successfully',
        hasInitializeApp: !!initializeApp,
        hasGetApps: !!getApps,
        hasCert: !!cert,
        hasGetFirestore: !!getFirestore
      };
    } catch (error) {
      firebaseAdminTest = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }

    // Test environment variables
    const envTest = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT_SET',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? 'SET' : 'NOT_SET',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET' : 'NOT_SET',
    };

    // Test Firebase initialization
    let initTest = null;
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        universe_domain: "googleapis.com"
      };

      if (getApps().length === 0) {
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        const db = getFirestore(app);
        initTest = {
          success: true,
          message: 'Firebase Admin SDK initialized successfully',
          projectId: process.env.FIREBASE_PROJECT_ID
        };
      } else {
        const db = getFirestore();
        initTest = {
          success: true,
          message: 'Firebase Admin SDK already initialized',
          projectId: process.env.FIREBASE_PROJECT_ID
        };
      }
    } catch (error) {
      initTest = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          firebaseAdminTest,
          envTest,
          initTest
        },
        message: 'Firebase Admin SDK test complete'
      }),
    };
  } catch (error) {
    logger.error('Error in test function:', error);
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
