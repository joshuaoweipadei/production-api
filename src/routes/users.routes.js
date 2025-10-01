import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUserById,
  deleteUserById,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// GET /users - fetch all users (admin only)
router.get('/', requireRole(['admin']), fetchAllUsers);

// GET /users/:id - fetch user by ID (authenticated users can access)
router.get('/:id', fetchUserById);

// PUT /users/:id - update user (users can update their own profile, admins can update any)
router.put('/:id', updateUserById);

// DELETE /users/:id - delete user (users can delete their own profile, admins can delete any)
router.delete('/:id', requireRole(['admin', 'user']), deleteUserById);

export default router;
