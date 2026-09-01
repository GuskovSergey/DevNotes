const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { userAuthMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  validateAuth,
  validateRegister,
  validateProfileUpdate,
  validateChangePassword,
  validatePost,
} = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

// Public Auth routes
router.get('/auth', userController.getAuthPage);
router.post('/auth/login', validateAuth, doubleCsrfProtection, userController.handleLogin);
router.post('/auth/register', validateRegister, doubleCsrfProtection, userController.handleRegister);
router.get('/auth/logout', userController.handleLogout);

// Protected User Account routes
router.get('/account', userAuthMiddleware, userController.getAccountPage);
router.get('/account/edit', userAuthMiddleware, userController.getEditProfilePage);
router.put('/account/profile', userAuthMiddleware, validateProfileUpdate, doubleCsrfProtection, userController.handleUpdateProfile);
router.get('/account/password', userAuthMiddleware, userController.getChangePasswordPage);
router.put('/account/password', userAuthMiddleware, validateChangePassword, doubleCsrfProtection, userController.handleChangePassword);

// Protected User Article Authoring routes
router.get('/my/posts', userAuthMiddleware, userController.getMyPostsPage);
router.get('/my/posts/new', userAuthMiddleware, userController.getCreatePostPage);
router.post('/my/posts', userAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, userController.handleCreatePost);
router.get('/my/posts/:id/edit', userAuthMiddleware, userController.getEditMyPostPage);
router.put('/my/posts/:id', userAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, userController.handleUpdateMyPost);
// Protected User Bookmarks & Likes routes
router.get('/my/bookmarks', userAuthMiddleware, userController.getBookmarksPage);
router.post('/my/bookmarks/toggle/:postId', userAuthMiddleware, doubleCsrfProtection, userController.handleToggleBookmark);
router.post('/my/likes/toggle/:postId', userAuthMiddleware, doubleCsrfProtection, userController.handleToggleLike);

// Public Author Profile route
router.get('/user/:username', optionalAuthMiddleware, userController.getPublicProfilePage);

module.exports = router;
