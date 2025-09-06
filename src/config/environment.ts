import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Google Cloud Configuration
  google: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                    path.join(__dirname, '../../mdm_server_key.json') ||
                    path.join(__dirname, '../../service-account-key.json'),
    enterpriseId: process.env.ENTERPRISE_ID || 'your_enterprise_id',
  },
  
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export const validateConfig = (): void => {
  if (config.google.enterpriseId === 'your_enterprise_id') {
    throw new Error('Please set ENTERPRISE_ID environment variable or update the config');
  }
  
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }
};
