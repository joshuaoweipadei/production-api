import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.service.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by ID: ${id}`);

    const user = await getUserById(id);

    res.json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    next(e);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    // Validate URL parameters
    const paramValidation = userIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    // Validate request body
    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    // Authorization check: users can only update their own profile
    // unless they are admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    // Only admins can change user roles
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles',
      });
    }

    // Remove role from updates if user is not admin
    if (req.user.role !== 'admin') {
      delete updates.role;
    }

    logger.info(`Updating user ID: ${id}`);

    const updatedUser = await updateUser(id, updates);

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    if (e.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already exists',
      });
    }

    next(e);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Authorization check: users can only delete their own profile
    // unless they are admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own profile',
      });
    }

    logger.info(`Deleting user ID: ${id}`);

    const deletedUser = await deleteUser(id);

    res.json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    next(e);
  }
};
