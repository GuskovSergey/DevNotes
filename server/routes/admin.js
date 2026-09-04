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

// Protected Admin Course Moderation routes
router.get('/admin/courses/pending', adminAuthMiddleware, adminController.getPendingCoursesPage);
router.post('/admin/courses/:id/approve', adminAuthMiddleware, doubleCsrfProtection, adminController.handleApproveCourse);
router.post('/admin/courses/:id/reject', adminAuthMiddleware, doubleCsrfProtection, adminController.handleRejectCourse);

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

// Protected Admin FAQ / Technical Interview Q&A routes
router.get('/admin/faq', adminAuthMiddleware, adminController.getFaqListPage);
router.get('/admin/faq/pending', adminAuthMiddleware, adminController.getPendingFaqPage);
router.post('/admin/faq/:id/approve', adminAuthMiddleware, doubleCsrfProtection, adminController.handleApproveFaqQuestion);
router.post('/admin/faq/:id/reject', adminAuthMiddleware, doubleCsrfProtection, adminController.handleRejectFaqQuestion);
router.post('/admin/faq/answers/:id/approve', adminAuthMiddleware, doubleCsrfProtection, adminController.handleApproveFaqAnswer);
router.post('/admin/faq/answers/:id/reject', adminAuthMiddleware, doubleCsrfProtection, adminController.handleRejectFaqAnswer);
router.get('/admin/faq/add', adminAuthMiddleware, doubleCsrfProtection, adminController.getAddFaqPage);
router.post('/admin/faq/add', adminAuthMiddleware, doubleCsrfProtection, adminController.createFaqQuestion);
router.get('/admin/faq/edit/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.getEditFaqPage);
router.post('/admin/faq/edit/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.updateFaqQuestion);
router.post('/admin/faq/delete/:id', adminAuthMiddleware, doubleCsrfProtection, adminController.deleteFaqQuestion);

// Protected Admin User Management route
router.get('/admin/users', adminAuthMiddleware, adminController.getUsersPage);

// Protected Admin Options & Taxonomy Management routes (Combined Categories & Tags)
router.get('/admin/categories', adminAuthMiddleware, adminController.getOptionsPage);
router.get('/admin/options', adminAuthMiddleware, adminController.getOptionsPage);
router.get('/admin/tags', adminAuthMiddleware, (req, res) => res.redirect('/admin/categories?tab=tags'));

// Category CRUD
router.post('/admin/categories', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAddCategory);
router.post('/admin/categories/:id/edit', adminAuthMiddleware, doubleCsrfProtection, adminController.handleEditCategory);
router.post('/admin/categories/:id/delete', adminAuthMiddleware, doubleCsrfProtection, adminController.handleDeleteCategory);

// Tag CRUD
router.post('/admin/tags', adminAuthMiddleware, doubleCsrfProtection, adminController.handleAddTag);
router.post('/admin/tags/:id/edit', adminAuthMiddleware, doubleCsrfProtection, adminController.handleEditTag);
router.post('/admin/tags/:id/delete', adminAuthMiddleware, doubleCsrfProtection, adminController.handleDeleteTag);

module.exports = router;