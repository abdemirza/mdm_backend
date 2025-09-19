// FCM Debug Service - Diagnostic endpoint for troubleshooting FCM issues
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  debug: (message, meta = {}) => console.log(`[DEBUG] ${message}`, meta),
};

class FCMDebugService {
  static async getAllDevices() {
    try {
      const response = await fetch('https://poetic-llama-889a15.netlify.app/api/custom-devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Custom devices API call failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Error fetching devices:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getDeviceByIdentifier(identifier) {
    try {
      const devicesResult = await this.getAllDevices();
      
      if (!devicesResult.success || !devicesResult.data) {
        return {
          success: false,
          error: 'Failed to fetch devices list'
        };
      }

      const device = devicesResult.data.find(d => 
        d.imei === identifier || d.androidId === identifier
      );

      return {
        success: device ? true : false,
        device: device || null,
        totalDevices: devicesResult.data.length,
        searchIdentifier: identifier
      };
    } catch (error) {
      logger.error('Error finding device:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async testFCMToken(fcmToken) {
    try {
      // Simulate FCM token validation
      const isValidFormat = fcmToken && fcmToken.length > 10;
      const tokenType = fcmToken ? (fcmToken.startsWith('test_') ? 'test' : 'real') : 'none';
      
      return {
        success: true,
        data: {
          token: fcmToken ? fcmToken.substring(0, 20) + '...' : 'none',
          isValidFormat,
          tokenType,
          length: fcmToken ? fcmToken.length : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    const debugPath = pathSegments.slice(2).join('/');

    if (httpMethod === 'GET') {
      if (debugPath === 'devices') {
        // GET /api/fcm-debug/devices - List all devices
        const result = await FCMDebugService.getAllDevices();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else if (debugPath.startsWith('device/')) {
        // GET /api/fcm-debug/device/{identifier} - Get specific device
        const identifier = debugPath.split('/')[1];
        const result = await FCMDebugService.getDeviceByIdentifier(identifier);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Debug endpoint not found'
          }),
        };
      }
    } else if (httpMethod === 'POST') {
      if (debugPath === 'test-token') {
        // POST /api/fcm-debug/test-token - Test FCM token
        const requestBody = body ? JSON.parse(body) : {};
        const { fcmToken } = requestBody;
        
        const result = await FCMDebugService.testFCMToken(fcmToken);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Debug endpoint not found'
          }),
        };
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed'
        }),
      };
    }
  } catch (error) {
    logger.error('Error in FCM debug function:', error);
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
