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
const { verifyToken } = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API (候選人填寫表單)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/candidates', candidateController.createCandidate);
router.post('/candidates/:id/answers', candidateController.submitAnswers);
router.post('/candidates/:id/personality', candidateController.submitPersonality);
router.post('/candidates/:id/submit', candidateController.finalSubmit);
router.get('/categories', jobCategoryController.getCategories);
router.get('/jobs/:jobId/questions', questionController.getQuestionsForJob);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ADMIN AUTH
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin/login', adminController.login);
router.post('/admin/login/2fa', twoFactorController.verifyLogin);
router.get('/admin/candidates/:id/resume-file', resumeController.getResumeFile);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: 所有 /admin 路由都需要先驗證 JWT Token
// ─────────────────────────────────────────────────────────────────────────────
router.use('/admin', verifyToken);

// ── 個人帳號 (任何登入帳號都可用) ──────────────────────────────────────────
router.get('/admin/2fa/status', twoFactorController.getStatus);
router.post('/admin/2fa/setup', twoFactorController.setup);
router.post('/admin/2fa/enable', twoFactorController.enable);
router.post('/admin/2fa/disable', twoFactorController.disable);
router.put('/admin/me/password', usersController.changePassword);
router.put('/admin/me/profile', usersController.updateProfile);

// ── 標籤 (讀取全開；新增/修改/刪除需要 manage_tags) ──────────────────────
router.get('/admin/tags', tagController.getAllTags);
router.post('/admin/tags', requirePermission('manage_tags'), tagController.createTag);
router.put('/admin/tags/:id', requirePermission('manage_tags'), tagController.updateTag);
router.delete('/admin/tags/:id', requirePermission('manage_tags'), tagController.deleteTag);

// ── 履歷總覽 (需要 view_resumes) ────────────────────────────────────────────
router.get('/admin/candidates', requirePermission('view_resumes'), adminController.getCandidates);
router.get('/admin/analytics/dashboard', requirePermission('view_resumes'), analyticsController.getDashboardAnalytics);
router.get('/admin/candidates/:id', requirePermission('view_resumes'), adminController.getCandidateById);
router.get('/admin/candidates/:id/interview-score', requirePermission('view_resumes'), interviewController.getInterviewScore);
router.get('/admin/candidates/:id/comments', requirePermission('view_resumes'), commentController.getComments);
router.get('/admin/candidates/:id/tags', requirePermission('view_resumes'), tagController.getCandidateTags);

// ── 履歷狀態異動 (需要 change_status) ───────────────────────────────────────
router.put('/admin/candidates/batch-status', requirePermission('change_status'), adminController.batchUpdateCandidateStatus);
router.put('/admin/candidates/:id/status', requirePermission('change_status'), adminController.updateCandidateStatus);

// ── 評分與 AI 分析 (需要 edit_resumes) ──────────────────────────────────────
router.post('/admin/candidates/:id/evaluations', requirePermission('edit_resumes'), adminController.addEvaluation);
router.post('/admin/candidates/:id/analyze', requirePermission('edit_resumes'), adminController.analyzeCandidate);
router.post('/admin/candidates/:id/interview-score', requirePermission('edit_resumes'), interviewController.saveInterviewScore);
router.post('/admin/candidates/:id/comments', requirePermission('edit_resumes'), commentController.addComment);
router.delete('/admin/candidates/:id/comments/:commentId', requirePermission('edit_resumes'), commentController.removeComment);
router.put('/admin/candidates/:id/tags', requirePermission('edit_resumes'), tagController.setCandidateTags);
router.post('/admin/candidates/:id/resume-upload', requirePermission('edit_resumes'), resumeController.uploadMiddleware, resumeController.uploadResume);
router.delete('/admin/candidates/:id/resume', requirePermission('edit_resumes'), resumeController.deleteResume);

// ── 刪除求職者 (需要 delete_resumes) ────────────────────────────────────────
router.delete('/admin/candidates/:id', requirePermission('delete_resumes'), adminController.deleteCandidate);

// ── 匯出 (需要 export_data) ──────────────────────────────────────────────────
router.get('/admin/candidates/:id/export', requirePermission('export_data'), adminController.exportPDF);

// ── 題庫 (讀取需要 view_jobs；修改需要 manage_questions) ─────────────────────
router.get('/admin/questions', requirePermission('view_jobs'), questionController.getAllQuestions);
router.post('/admin/questions', requirePermission('manage_questions'), questionController.createQuestion);
router.put('/admin/questions/:id', requirePermission('manage_questions'), questionController.updateQuestion);
router.delete('/admin/questions/:id', requirePermission('manage_questions'), questionController.deleteQuestion);
router.get('/admin/jobs/:jobId/questions', requirePermission('view_jobs'), questionController.getQuestionsForJob);
router.put('/admin/jobs/:jobId/questions', requirePermission('manage_questions'), questionController.setQuestionsForJob);

// ── 職缺分類 (讀取全開；修改需要 manage_jobs) ────────────────────────────────
router.get('/admin/job-categories', jobCategoryController.getCategories);
router.post('/admin/job-categories', requirePermission('manage_jobs'), jobCategoryController.createCategory);
router.put('/admin/job-categories/:id', requirePermission('manage_jobs'), jobCategoryController.updateCategory);
router.delete('/admin/job-categories/:id', requirePermission('manage_jobs'), jobCategoryController.deleteCategory);

// ── 人員管理 (需要 manage_users) ─────────────────────────────────────────────
router.get('/admin/users', requirePermission('manage_users'), usersController.getUsers);
router.post('/admin/users', requirePermission('manage_users'), usersController.createUser);
router.put('/admin/users/:id', requirePermission('manage_users'), usersController.updateUser);
router.delete('/admin/users/:id', requirePermission('manage_users'), usersController.deleteUser);

// ── 操作日誌 (需要 view_system) ──────────────────────────────────────────────
router.get('/admin/audit-logs', requirePermission('view_system'), auditLogController.getAuditLogs);

module.exports = router;
