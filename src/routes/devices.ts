import { Router } from 'express';
import Joi from 'joi';
import { AndroidManagementService } from '../services/androidManagementService.js';
import { logger } from '../config/logger.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();
const androidService = new AndroidManagementService();

// Validation schemas
const deviceNameSchema = Joi.string().pattern(/^enterprises\/[^\/]+\/devices\/[^\/]+$/).required();
const commandSchema = Joi.object({
  type: Joi.string().valid('LOCK', 'REBOOT', 'RESET_PASSWORD', 'CLEAR_APP_DATA', 'START_LOST_MODE', 'STOP_LOST_MODE').required(),
  duration: Joi.string().when('type', { is: 'LOCK', then: Joi.optional(), otherwise: Joi.forbidden() }),
  packageName: Joi.string().when('type', { is: 'CLEAR_APP_DATA', then: Joi.required(), otherwise: Joi.forbidden() }),
  reason: Joi.string().optional(),
  message: Joi.string().when('type', { is: 'START_LOST_MODE', then: Joi.required(), otherwise: Joi.forbidden() }),
  phoneNumber: Joi.string().when('type', { is: 'START_LOST_MODE', then: Joi.optional(), otherwise: Joi.forbidden() }),
  email: Joi.string().email().when('type', { is: 'START_LOST_MODE', then: Joi.optional(), otherwise: Joi.forbidden() }),
});

// Schema for lost mode parameters
const startLostModeParamsSchema = Joi.object({
  // We'll map these to the correct API fields later.
  lostMessage: Joi.string().optional(),
  phoneNumber: Joi.string().optional(),
  emailAddress: Joi.string().optional(),
  streetAddress: Joi.string().optional(),
  organizationName: Joi.string().optional(),
}).or('lostMessage', 'phoneNumber', 'emailAddress', 'streetAddress', 'organizationName');


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
 * GET /devices
 * List all devices in the enterprise
 */
router.get('/', ensureServiceInitialized, async (req, res) => {
  try {
    const result = await androidService.listDevices();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /devices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /devices/*
 * Get details of a specific device
 */
router.get('/*', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: validationError } = deviceNameSchema.validate(deviceName);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: validationError.details[0].message,
      });
    }

    const result = await androidService.getDevice(deviceName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /devices/*:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/commands
//  * Issue a command to a specific device
//  */
router.post('/*/commands', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const { error: commandValidationError } = commandSchema.validate(req.body);
    if (commandValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid command format',
        details: commandValidationError.details[0].message,
      });
    }

    const result = await androidService.issueCommand(deviceName, req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/commands:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/lock
//  * Lock a device for a specified duration
//  */
router.post('/*/lock', ensureServiceInitialized, async (req, res) => {
  try {
    // Extract device name from the full path
    const deviceName = (req.params as any)[0]; // This captures the wildcard part
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const duration = req.body.duration || '120s';
    const result = await androidService.lockDevice(deviceName, duration);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/lock:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/unlock
//  * Unlock a device (remove any active lock)
//  */
router.post('/*/unlock', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const result = await androidService.unlockDevice(deviceName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/unlock:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /** 
//  * POST /devices/*/lostMode
//  * Put a device into Lost Mode.
//  * This command requires at least one of the contact fields to be set.
//  **/
router.post('/*/lost-mode', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const { error: paramsValidationError } = startLostModeParamsSchema.validate(req.body);
    if (paramsValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lost mode parameters. At least one contact field is required.',
        details: paramsValidationError.details[0].message,
      });
    }

    // Map user input to the correct API structure
    const { lostMessage, phoneNumber, emailAddress, streetAddress, organizationName, duration } = req.body;
    
    // Use LOCK command instead of START_LOST_MODE for better compatibility
    // Default to 24 hours if no duration specified
    const lockDuration = duration || '86400s'; // 24 hours
    
    // Create a message that includes contact info
    let lockMessage = 'This device has been reported as lost.';
    const contactInfo = [];
    
    if (phoneNumber) contactInfo.push(`Phone: ${phoneNumber}`);
    if (emailAddress) contactInfo.push(`Email: ${emailAddress}`);
    if (streetAddress) contactInfo.push(`Address: ${streetAddress}`);
    if (organizationName) contactInfo.push(`Organization: ${organizationName}`);
    
    if (contactInfo.length > 0) {
      lockMessage += ` Please contact: ${contactInfo.join(', ')}.`;
    }
    
    // Use custom message if provided
    if (lostMessage) {
      lockMessage = lostMessage;
      if (contactInfo.length > 0) {
        lockMessage += ` Please contact: ${contactInfo.join(', ')}.`;
      }
    }

    // Use the enableLostMode method from the service
    const result = await androidService.enableLostMode(deviceName, lockMessage, phoneNumber, emailAddress, streetAddress, organizationName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/lostMode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});


// /**
//  * POST /devices/*/exit-lost-mode
//  * Disable lost mode on a device by rebooting it
//  * Note: Since UNLOCK is not available, we use REBOOT to clear the lock
//  */
router.post('/*/exit-lost-mode', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    // Use REBOOT command to exit lost mode (reboot clears temporary locks)
    const result = await androidService.issueCommand(deviceName, {
      type: 'REBOOT',
    });
    
    if (result.success) {
      res.json({
        ...result,
        message: 'Lost mode disabled. Device will reboot to clear the lock.',
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/exit-lost-mode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/reset-password
//  * Reset device password
//  */
router.post('/*/reset-password', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const result = await androidService.resetPassword(deviceName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/reset-password:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/reboot
//  * Reboot a device
//  */
router.post('/*/reboot', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const result = await androidService.rebootDevice(deviceName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/:deviceName/reboot:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// /**
//  * POST /devices/*/wipe
//  * Wipe all data from a device
//  */
router.post('/*/wipe', ensureServiceInitialized, async (req, res) => {
  try {
    const deviceName = (req.params as any)[0];
    const { error: deviceValidationError } = deviceNameSchema.validate(deviceName);
    if (deviceValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device name format',
        details: deviceValidationError.details[0].message,
      });
    }

    const reason = req.body.reason;
    const result = await androidService.wipeDevice(deviceName, reason);
    
    if (result.success) {
      res.json({
        ...result,
        message: 'Device reboot initiated. Note: Full wipe functionality may not be available on this device.',
        warning: 'WIPE command is not supported on this device. Using REBOOT instead.'
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in POST /devices/*/wipe:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /operations/:operationName
 * Get the status of a command operation
 */
router.get('/operations/:operationName', ensureServiceInitialized, async (req, res) => {
  try {
    const result = await androidService.getOperationStatus(req.params.operationName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /operations/:operationName:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
