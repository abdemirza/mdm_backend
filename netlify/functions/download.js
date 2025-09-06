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
      'mdm-dpc-app.apk': './mdm-dpc-app.apk',
      'app.apk': './mdm-dpc-app.apk', // Alias
      'test.txt': './test.txt', // Test file
    };
    
    // Files that should redirect to public directory
    const redirectFiles = {
      'mdm-dpc-app.apk': '/public/downloads/mdm-dpc-app.apk',
      'app.apk': '/public/downloads/mdm-dpc-app.apk',
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
      
      // Try multiple possible paths for the APK file
      const possiblePaths = [
        allowedFiles[fileName],
        `./${fileName}`,
        `../${fileName}`,
        `./public/downloads/${fileName}`,
        `./downloads/${fileName}`,
      ];
      
      let filePath = null;
      let fileBuffer = null;
      
      // Find the file in any of the possible locations
      for (const testPath of possiblePaths) {
        try {
          if (fs.existsSync(testPath)) {
            filePath = testPath;
            fileBuffer = fs.readFileSync(testPath);
            console.log(`Found APK file at: ${testPath}`);
            break;
          }
        } catch (err) {
          console.log(`Tried path ${testPath}: ${err.message}`);
        }
      }
      
      if (!fileBuffer) {
        // If it's an APK file, redirect to public directory
        if (redirectFiles[fileName]) {
          return {
            statusCode: 302,
            headers: {
              ...headers,
              'Location': redirectFiles[fileName],
            },
            body: '',
          };
        }
        
        // List available files for debugging
        const debugInfo = {
          searchedPaths: possiblePaths,
          currentDirectory: process.cwd(),
          availableFiles: []
        };
        
        try {
          debugInfo.availableFiles = fs.readdirSync('.');
        } catch (err) {
          debugInfo.availableFiles = ['Could not read directory'];
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'File not found on server',
            debug: debugInfo,
            redirectSuggestion: redirectFiles[fileName] ? `Try: ${redirectFiles[fileName]}` : null,
          }),
        };
      }
      
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
