const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validateAuth, validatePost } = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

// Auth routes
router.get('/admin', adminController.getLoginPage);
router.post('/admin', validateAuth, doubleCsrfProtection, adminController.handleLogin);
router.get('/logout', adminController.handleLogout);

// Protected Dashboard routes
router.get('/dashboard', authMiddleware, adminController.getDashboard);

// Protected Post CRUD routes
router.get('/add-post', authMiddleware, adminController.getAddPostPage);
router.post('/add-post', authMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, adminController.handleAddPost);

router.get('/edit-post/:id', authMiddleware, adminController.getEditPostPage);
router.put('/edit-post/:id', authMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, adminController.handleEditPost);
router.delete('/delete-post/:id', authMiddleware, doubleCsrfProtection, adminController.handleDeletePost);

// Protected Comments Moderation routes
router.get('/admin/comments', authMiddleware, adminController.getCommentsPage);
router.post('/admin/comments/:id/approve', authMiddleware, doubleCsrfProtection, adminController.handleApproveComment);
router.delete('/admin/comments/:id', authMiddleware, doubleCsrfProtection, adminController.handleDeleteComment);

module.exports = router;