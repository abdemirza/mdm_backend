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
    const { path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'download' from path segments
    const fileName = pathSegments.slice(2).join('/');

    // Only allow specific files for security
    const allowedFiles = {
      'mdm-dpc-app.apk': 'public/downloads/mdm-dpc-app.apk',
      'app.apk': 'public/downloads/mdm-dpc-app.apk', // Alias
    };

    if (!allowedFiles[fileName]) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'File not found',
          availableFiles: Object.keys(allowedFiles),
        }),
      };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = allowedFiles[fileName];
      
      if (!fs.existsSync(filePath)) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'APK file not found on server',
          }),
        };
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
        body: fileBuffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error('Error serving APK file:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to serve APK file',
          details: error.message,
        }),
      };
    }
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
