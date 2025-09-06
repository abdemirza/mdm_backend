export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    // Don't expose sensitive data, just show what's available
    const envInfo = {
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET',
      ENTERPRISE_ID: process.env.ENTERPRISE_ID || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET',
      // Show first few characters of the key to verify it's there (safely)
      GOOGLE_SERVICE_ACCOUNT_KEY_PREVIEW: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 50) + '...' : 'NOT SET'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Environment variables debug info',
        environment: envInfo,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }),
  };
};
