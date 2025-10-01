import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided',
      });
    }

    req.user = jwttoken.verify(token);
    next();
  } catch (e) {
    logger.error('Authentication error', e);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn(
          `Access denied for user ${req.user.email} with role ${req.user.role}. Required: ${roles.join(', ')}`
        );
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (e) {
      logger.error('Role verification error:', e);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error during role verification',
      });
    }
  };
};