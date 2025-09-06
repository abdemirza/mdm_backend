import { Router } from 'express';
import { AndroidManagementService } from '../services/androidManagementService.js';
import { logger } from '../config/logger.js';

const router = Router();
const androidService = new AndroidManagementService();

// Middleware to ensure service is initialized
const ensureServiceInitialized = async (req: any, res: any, next: any) => {
  if (!androidService['service']) {
    const initialized = await androidService.initialize();
    if (!initialized) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Android Management service',
      });
    }
  }
  next();
};

/**
 * GET /enterprise
 * Get enterprise information
 */
router.get('/', ensureServiceInitialized, async (req, res) => {
  try {
    const result = await androidService.getEnterprise();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /enterprise:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /enterprise/policies
 * List all policies in the enterprise
 */
router.get('/policies', ensureServiceInitialized, async (req, res) => {
  try {
    const result = await androidService.listPolicies();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /enterprise/policies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
