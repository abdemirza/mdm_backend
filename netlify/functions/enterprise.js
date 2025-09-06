import { google } from 'googleapis';
import fs from 'fs';

// Simple logger for Netlify Functions
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
};

// Android Management Service for Netlify Functions
class AndroidManagementService {
  constructor() {
    this.service = null;
    this.enterpriseName = `enterprises/${process.env.ENTERPRISE_ID || 'LC048psd8h'}`;
  }

  async initialize() {
    try {
      logger.info('Starting authentication process...');
      logger.info('Environment variables:', {
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET',
        ENTERPRISE_ID: process.env.ENTERPRISE_ID || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET'
      });

      // Check if we have the service account key as environment variable
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        logger.info('Using service account key from environment variable');
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
          const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/androidmanagement'],
          });

          const client = await auth.getClient();
          this.service = google.androidmanagement({
            version: 'v1',
            auth: client,
          });

          logger.info('Successfully authenticated with Android Management API using environment credentials');
          return true;
        } catch (parseError) {
          logger.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', parseError);
          return false;
        }
      }

      // Fallback to file-based authentication
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './mdm_server_key.json';
      logger.info(`Checking for service account file at: ${credentialsPath}`);
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error(`Service account file not found at ${credentialsPath}`);
        logger.info('Available files in current directory:', fs.readdirSync('.'));
        return false;
      }

      logger.info('Service account file found, proceeding with file-based auth');
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/androidmanagement'],
      });

      const client = await auth.getClient();
      this.service = google.androidmanagement({
        version: 'v1',
        auth: client,
      });

      logger.info('Successfully authenticated with Android Management API using file');
      return true;
    } catch (error) {
      logger.error('Authentication failed:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return false;
    }
  }

  async getEnterprise() {
    try {
      logger.info(`Getting enterprise details: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.get({
        name: this.enterpriseName,
      });

      return {
        success: true,
        data: response.data,
        message: 'Enterprise details retrieved successfully',
      };
    } catch (error) {
      logger.error('Error getting enterprise:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async listPolicies() {
    try {
      logger.info(`Listing policies for enterprise: ${this.enterpriseName}`);
      
      const response = await this.service.enterprises.policies.list({
        parent: this.enterpriseName,
      });

      const policies = response.data.policies || [];
      
      logger.info(`Found ${policies.length} policies`);
      return {
        success: true,
        data: policies,
        message: `Found ${policies.length} policies`,
      };
    } catch (error) {
      logger.error('Error listing policies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

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