import { AndroidManagementService } from '../../src/services/androidManagementService.js';
import { logger } from '../../src/config/logger.js';

const androidService = new AndroidManagementService();

// Initialize service
let serviceInitialized = false;
const initializeService = async () => {
  if (!serviceInitialized) {
    serviceInitialized = await androidService.initialize();
    if (!serviceInitialized) {
      throw new Error('Failed to initialize Android Management service');
    }
  }
};

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    await initializeService();

    const { httpMethod, path, body, queryStringParameters } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'devices' from path segments
    const devicePath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'GET':
        if (devicePath === '') {
          // GET /api/devices - List all devices
          const result = await androidService.listDevices();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.startsWith('operations/')) {
          // GET /api/devices/operations/:operationName
          const operationName = devicePath.replace('operations/', '');
          const result = await androidService.getOperationStatus(operationName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else {
          // GET /api/devices/:deviceName - Get device details
          const result = await androidService.getDevice(devicePath);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        }

      case 'POST':
        const requestBody = body ? JSON.parse(body) : {};
        
        if (devicePath.endsWith('/lock')) {
          // POST /api/devices/:deviceName/lock
          const deviceName = devicePath.replace('/lock', '');
          const duration = requestBody.duration || '120s';
          const result = await androidService.lockDevice(deviceName, duration);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/unlock')) {
          // POST /api/devices/:deviceName/unlock
          const deviceName = devicePath.replace('/unlock', '');
          const result = await androidService.unlockDevice(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/lost-mode')) {
          // POST /api/devices/:deviceName/lost-mode
          const deviceName = devicePath.replace('/lost-mode', '');
          const { lostMessage, phoneNumber, emailAddress, streetAddress, organizationName } = requestBody;
          const result = await androidService.enableLostMode(
            deviceName, 
            lostMessage, 
            phoneNumber, 
            emailAddress, 
            streetAddress, 
            organizationName
          );
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/exit-lost-mode')) {
          // POST /api/devices/:deviceName/exit-lost-mode
          const deviceName = devicePath.replace('/exit-lost-mode', '');
          const result = await androidService.disableLostMode(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/reset-password')) {
          // POST /api/devices/:deviceName/reset-password
          const deviceName = devicePath.replace('/reset-password', '');
          const result = await androidService.resetPassword(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/reboot')) {
          // POST /api/devices/:deviceName/reboot
          const deviceName = devicePath.replace('/reboot', '');
          const result = await androidService.rebootDevice(deviceName);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/wipe')) {
          // POST /api/devices/:deviceName/wipe
          const deviceName = devicePath.replace('/wipe', '');
          const reason = requestBody.reason;
          const result = await androidService.wipeDevice(deviceName, reason);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (devicePath.endsWith('/commands')) {
          // POST /api/devices/:deviceName/commands
          const deviceName = devicePath.replace('/commands', '');
          const result = await androidService.issueCommand(deviceName, requestBody);
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Endpoint not found',
            }),
          };
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed',
          }),
        };
    }
  } catch (error) {
    logger.error('Error in devices function:', error);
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
