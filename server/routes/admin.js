const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuthMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validateAuth, validatePost } = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

// Auth routes
router.get('/admin', adminController.getLoginPage);
router.post('/admin', validateAuth, doubleCsrfProtection, adminController.handleLogin);
router.get('/logout', adminController.handleLogout);

// Protected Admin Dashboard routes
router.get('/dashboard', adminAuthMiddleware, adminController.getDashboard);

// Protected Admin Post CRUD routes
router.get('/add-post', adminAuthMiddleware, adminController.getAddPostPage);
router.post('/add-post', adminAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, adminController.handleAddPost);

router.get('/edit-post/:id', adminAuthMiddleware, adminController.getEditPostPage);
router.put('/edit-post/:id', adminAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, adminController.handleEditPost);
router.delete('/delete-post/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.handleDeletePost);

// Protected Admin Comments Moderation routes
router.get('/admin/comments', adminAuthMiddleware, adminController.getCommentsPage);
router.post('/admin/comments/:id/approve', adminAuthMiddleware, doubleCsrfProtection, adminController.handleApproveComment);
router.delete('/admin/comments/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.handleDeleteComment);

// Protected Admin Post Moderation routes
router.get('/admin/posts/pending', adminAuthMiddleware, adminController.getPendingPostsPage);
router.post('/admin/posts/:id/approve', adminAuthMiddleware, doubleCsrfProtection, adminController.handleApprovePost);
router.post('/admin/posts/:id/reject', adminAuthMiddleware, doubleCsrfProtection, adminController.handleRejectPost);

// Protected Admin Course & Lesson CRUD routes
router.get('/admin/courses', adminAuthMiddleware, adminController.getAdminCoursesPage);
router.get('/admin/courses/new', adminAuthMiddleware, adminController.getAdminAddCoursePage);
router.post('/admin/courses', adminAuthMiddleware, upload.single('coverImage'), doubleCsrfProtection, adminController.handleAdminAddCourse);
router.get('/admin/courses/:id/edit', adminAuthMiddleware, adminController.getAdminEditCoursePage);
router.put('/admin/courses/:id', adminAuthMiddleware, upload.single('coverImage'), doubleCsrfProtection, adminController.handleAdminEditCourse);
router.delete('/admin/courses/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAdminDeleteCourse);

router.get('/admin/courses/:courseId/lessons/new', adminAuthMiddleware, adminController.getAdminAddLessonPage);
router.post('/admin/courses/:courseId/lessons', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAdminAddLesson);
router.get('/admin/lessons/:id/edit', adminAuthMiddleware, adminController.getAdminEditLessonPage);
router.put('/admin/lessons/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAdminEditLesson);
router.delete('/admin/lessons/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAdminDeleteLesson);

module.exports = router;