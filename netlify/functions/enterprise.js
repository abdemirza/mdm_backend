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

    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Remove 'api' and 'enterprise' from path segments
    const enterprisePath = pathSegments.slice(2).join('/');

    switch (httpMethod) {
      case 'GET':
        if (enterprisePath === '') {
          // GET /api/enterprise - Get enterprise details
          const result = await androidService.getEnterprise();
          return {
            statusCode: result.success ? 200 : 500,
            headers,
            body: JSON.stringify(result),
          };
        } else if (enterprisePath === 'policies') {
          // GET /api/enterprise/policies - List all policies
          const result = await androidService.listPolicies();
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
    logger.error('Error in enterprise function:', error);
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
