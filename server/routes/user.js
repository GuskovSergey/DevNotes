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
router.put('/account/profile', userAuthMiddleware, upload.single('avatar'), validateProfileUpdate, doubleCsrfProtection, userController.handleUpdateProfile);
router.get('/account/password', userAuthMiddleware, userController.getChangePasswordPage);
router.put('/account/password', userAuthMiddleware, validateChangePassword, doubleCsrfProtection, userController.handleChangePassword);

// Protected User Article Authoring routes
router.get('/my/posts', userAuthMiddleware, userController.getMyPostsPage);
router.get('/my/posts/new', userAuthMiddleware, userController.getCreatePostPage);
router.post('/my/posts', userAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, userController.handleCreatePost);
router.get('/my/posts/:id/edit', userAuthMiddleware, userController.getEditMyPostPage);
router.put('/my/posts/:id', userAuthMiddleware, upload.single('featuredImage'), validatePost, doubleCsrfProtection, userController.handleUpdateMyPost);

// Protected User Course Authoring routes
router.get('/my/courses', userAuthMiddleware, userController.getMyCoursesPage);
router.get('/my/courses/new', userAuthMiddleware, userController.getCreateCoursePage);
router.post('/my/courses', userAuthMiddleware, upload.single('coverImage'), doubleCsrfProtection, userController.handleCreateCourse);
router.get('/my/courses/:id/edit', userAuthMiddleware, userController.getEditMyCoursePage);
router.put('/my/courses/:id', userAuthMiddleware, upload.single('coverImage'), doubleCsrfProtection, userController.handleUpdateMyCourse);
router.delete('/my/courses/:id', userAuthMiddleware, doubleCsrfProtection, userController.handleDeleteMyCourse);

router.get('/my/courses/:courseId/lessons/new', userAuthMiddleware, userController.getCreateMyLessonPage);
router.post('/my/courses/:courseId/lessons', userAuthMiddleware, doubleCsrfProtection, userController.handleCreateMyLesson);
router.get('/my/lessons/:id/edit', userAuthMiddleware, userController.getEditMyLessonPage);
router.put('/my/lessons/:id', userAuthMiddleware, doubleCsrfProtection, userController.handleUpdateMyLesson);
router.delete('/my/lessons/:id', userAuthMiddleware, doubleCsrfProtection, userController.handleDeleteMyLesson);

// Protected User Q&A Submission routes
router.get('/my/questions', userAuthMiddleware, userController.getMyQuestionsPage);
router.get('/my/questions/new', userAuthMiddleware, doubleCsrfProtection, userController.getAskQuestionPage);
router.post('/my/questions/new', userAuthMiddleware, doubleCsrfProtection, userController.handleAskQuestion);
router.post('/faq/:id/answer', userAuthMiddleware, doubleCsrfProtection, userController.handleAnswerSubmission);
// Protected User Bookmarks, Likes, History & Notifications routes
router.get('/my/bookmarks', userAuthMiddleware, userController.getBookmarksPage);
router.get('/my/likes', userAuthMiddleware, userController.getLikedPostsPage);
router.get('/my/history', userAuthMiddleware, userController.getReadingHistoryPage);
router.get('/my/notifications', userAuthMiddleware, userController.getNotificationsPage);
router.get('/api/notifications', userAuthMiddleware, userController.apiGetNotifications);
router.post('/api/notifications/read-all', userAuthMiddleware, doubleCsrfProtection, userController.apiMarkAllNotificationsRead);
router.post('/my/notifications/read-all', userAuthMiddleware, doubleCsrfProtection, userController.handleMarkAllNotificationsRead);
router.post('/my/history/clear', userAuthMiddleware, doubleCsrfProtection, userController.handleClearHistory);
router.post('/my/bookmarks/toggle/:postId', userAuthMiddleware, doubleCsrfProtection, userController.handleToggleBookmark);
router.post('/my/likes/toggle/:postId', userAuthMiddleware, doubleCsrfProtection, userController.handleToggleLike);

// Public Author Profile routes
router.get('/user/:username', optionalAuthMiddleware, userController.getPublicProfilePage);
router.get('/profile/:username', optionalAuthMiddleware, userController.getPublicProfilePage);

module.exports = router;
