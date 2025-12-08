import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listAllExams, setExamStatus, getPendingExams, getAuditLogs, softDeleteResult, restoreResult, getDeletedResults } from '../controllers/adminController.js';
import { getAccessLogs, getUserAccessHistory, getResourceAccessHistory } from '../middlewares/accessLog.js';
import { getAdminViewUserSessions, revokeUserSession, revokeAllUserSessionsAdmin } from '../middlewares/sessionManagement.js';
import { getUserChangeHistory, getChangeStatistics } from '../middlewares/changeTracking.js';
import { bulkImportUpload, bulkImportStudents, getBulkImportHistory, getBulkImportStatistics, downloadCSVTemplate } from '../middlewares/bulkImport.js';
import { Result } from '../models/Result.js';
import { requireIdentityVerification } from '../middlewares/verifyIdentity.js';

const router = Router();
router.use(authMiddleware(), requireRole('admin'));

router.get('/exams', listAllExams);
router.get('/exams/pending', getPendingExams);

// Sensitive operation: Approve/Reject exam requires identity verification
router.patch('/exams/:examId/status', requireIdentityVerification, setExamStatus);

router.get('/audit-logs', getAuditLogs);

// Access logging endpoints
router.get('/access-logs', getAccessLogs); // View all access logs with filtering
router.get('/access-logs/user/:userId', getUserAccessHistory); // View specific user's access history
router.get('/access-logs/:resource/:resourceId', getResourceAccessHistory); // View who accessed a resource

// Result deletion management
router.get('/results/deleted', getDeletedResults); // View soft-deleted results
router.post('/results/:resultId/delete', requireIdentityVerification, softDeleteResult); // Soft delete requires verification
router.post('/results/:resultId/restore', requireIdentityVerification, restoreResult); // Restore requires verification

// Session management endpoints
router.get('/users/:userId/sessions', getAdminViewUserSessions); // View all sessions for a user
router.post('/sessions/:sessionId/revoke', requireIdentityVerification, revokeUserSession); // Revoke a session
router.post('/users/:userId/sessions/revoke-all', requireIdentityVerification, revokeAllUserSessionsAdmin); // Revoke all sessions for a user

// Change tracking endpoints
router.get('/users/:userId/change-history', getUserChangeHistory); // View all changes made by a user
router.get('/changes/statistics', getChangeStatistics); // View change statistics and analytics

// Bulk student import endpoints
router.post('/students/bulk-import', bulkImportUpload.single('file'), bulkImportStudents); // Upload CSV and import
router.get('/students/bulk-imports', getBulkImportHistory); // View import history
router.get('/students/bulk-imports/statistics', getBulkImportStatistics); // View import statistics
router.get('/students/bulk-import-template', downloadCSVTemplate); // Download CSV template

// Teacher view results - keep under admin router? Better to expose under teacher router.
export default router;
