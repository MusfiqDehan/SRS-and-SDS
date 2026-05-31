import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import {
  listDocuments,
  getDocument,
  updateDocument,
} from '../controllers/document.controller.js';
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../controllers/section.controller.js';
import { authenticate, authorize } from '../middleware/index.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Health check
router.get('/health', (_req, res) =>
  sendSuccess(res, { message: 'Backend is healthy', data: { status: 'ok' } })
);

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);

// Documents (public reads)
router.get('/documents', listDocuments);
router.get('/documents/:slug', getDocument);

// Admin-only document + section management
router.patch('/documents/:slug', authenticate, authorize('admin'), updateDocument);
router.post('/documents/:slug/sections', authenticate, authorize('admin'), createSection);
router.put('/documents/:slug/sections/reorder', authenticate, authorize('admin'), reorderSections);
router.patch('/sections/:id', authenticate, authorize('admin'), updateSection);
router.delete('/sections/:id', authenticate, authorize('admin'), deleteSection);

export default router;
