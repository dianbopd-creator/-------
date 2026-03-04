const express = require('express');
const router = express.Router();

const candidateController = require('../controllers/candidateController');
const adminController = require('../controllers/adminController');
const usersController = require('../controllers/usersController');
const jobCategoryController = require('../controllers/jobCategoryController');
const auditLogController = require('../controllers/auditLogController');
const interviewController = require('../controllers/interviewController');
const resumeController = require('../controllers/resumeController');
const twoFactorController = require('../controllers/twoFactorController');
const commentController = require('../controllers/commentController');
const tagController = require('../controllers/tagController');
const analyticsController = require('../controllers/analyticsController');
const questionController = require('../controllers/questionController');
const { verifyToken, requireMinimumRole } = require('../middleware/authMiddleware');

// --- Public API for Candidates ---
router.post('/candidates', candidateController.createCandidate);
router.post('/candidates/:id/answers', candidateController.submitAnswers);
router.post('/candidates/:id/personality', candidateController.submitPersonality);
router.post('/candidates/:id/submit', candidateController.finalSubmit);
router.get('/categories', jobCategoryController.getCategories);
// Public endpoint so the QA page can fetch job-specific questions
router.get('/jobs/:jobId/questions', questionController.getQuestionsForJob);

// --- Admin Auth API ---
router.post('/admin/login', adminController.login);
router.post('/admin/login/2fa', twoFactorController.verifyLogin); // Public: step 2 of login

// --- Resume file (public, for iframe embedding) ---
router.get('/admin/candidates/:id/resume-file', resumeController.getResumeFile);

// --- Protected Admin API (Requires valid JWT) ---
router.use('/admin', verifyToken);

// Tags
router.get('/admin/tags', tagController.getAllTags);
router.post('/admin/tags', tagController.createTag);
router.put('/admin/tags/:id', tagController.updateTag);
router.delete('/admin/tags/:id', tagController.deleteTag);

// Candidates
router.get('/admin/candidates', adminController.getCandidates);
router.get('/admin/analytics/dashboard', analyticsController.getDashboardAnalytics);
router.get('/admin/candidates/:id', adminController.getCandidateById);
router.put('/admin/candidates/batch-status', adminController.batchUpdateCandidateStatus);
router.put('/admin/candidates/:id/status', adminController.updateCandidateStatus);
router.delete('/admin/candidates/:id', adminController.deleteCandidate);
router.post('/admin/candidates/:id/evaluations', adminController.addEvaluation);
router.get('/admin/candidates/:id/export', adminController.exportPDF);
router.post('/admin/candidates/:id/analyze', adminController.analyzeCandidate);
router.post('/admin/candidates/:id/resume-upload', resumeController.uploadMiddleware, resumeController.uploadResume);
router.delete('/admin/candidates/:id/resume', resumeController.deleteResume);
router.get('/admin/candidates/:id/interview-score', interviewController.getInterviewScore);
router.post('/admin/candidates/:id/interview-score', interviewController.saveInterviewScore);
router.get('/admin/candidates/:id/comments', commentController.getComments);
router.post('/admin/candidates/:id/comments', commentController.addComment);
router.delete('/admin/candidates/:id/comments/:commentId', commentController.removeComment);
router.get('/admin/candidates/:id/tags', tagController.getCandidateTags);
router.put('/admin/candidates/:id/tags', tagController.setCandidateTags);

// Question Bank
router.get('/admin/questions', questionController.getAllQuestions);
router.post('/admin/questions', questionController.createQuestion);
router.put('/admin/questions/:id', questionController.updateQuestion);
router.delete('/admin/questions/:id', questionController.deleteQuestion);
router.get('/admin/jobs/:jobId/questions', questionController.getQuestionsForJob);
router.put('/admin/jobs/:jobId/questions', questionController.setQuestionsForJob);

// --- Protected Current User API ---
router.put('/admin/me/password', verifyToken, usersController.changePassword);
router.put('/admin/me/profile', verifyToken, usersController.updateProfile);

// --- Protected User Management API (Requires 'admin' role) ---
router.use('/admin/users', verifyToken, requireMinimumRole('admin'));
router.get('/admin/users', usersController.getUsers);
router.post('/admin/users', usersController.createUser);
router.put('/admin/users/:id', usersController.updateUser);
router.delete('/admin/users/:id', usersController.deleteUser);

// --- Protected Job Categories Management API (Requires 'admin' role) ---
router.post('/admin/job-categories', verifyToken, requireMinimumRole('admin'), jobCategoryController.createCategory);
router.put('/admin/job-categories/:id', verifyToken, requireMinimumRole('admin'), jobCategoryController.updateCategory);
router.delete('/admin/job-categories/:id', verifyToken, requireMinimumRole('admin'), jobCategoryController.deleteCategory);

// --- Protected Audit Logs API (Requires 'admin' role) ---
router.get('/admin/audit-logs', verifyToken, requireMinimumRole('admin'), auditLogController.getAuditLogs);

// --- 2FA (TOTP) API ---
router.get('/admin/2fa/status', verifyToken, twoFactorController.getStatus); // Read 2FA status
router.post('/admin/2fa/setup', verifyToken, twoFactorController.setup);     // Generate QR code
router.post('/admin/2fa/enable', verifyToken, twoFactorController.enable);   // Confirm & enable
router.post('/admin/2fa/disable', verifyToken, twoFactorController.disable); // Disable 2FA

module.exports = router;
