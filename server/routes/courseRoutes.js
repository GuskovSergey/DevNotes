const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { optionalAuthMiddleware, userAuthMiddleware } = require('../middlewares/authMiddleware');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

// Public Courses Hub Catalog
router.get('/courses', optionalAuthMiddleware, courseController.getCoursesHub);

// Public Course Overview & Table of Contents Page
router.get('/courses/:slug', optionalAuthMiddleware, courseController.getCoursePage);

// Public Single Lesson Reader Page
router.get('/courses/:courseSlug/lessons/:lessonSlug', optionalAuthMiddleware, courseController.getLessonPage);

// Toggle Lesson Completion Progress (Authenticated Users)
router.post('/courses/:courseSlug/lessons/:lessonSlug/complete', userAuthMiddleware, doubleCsrfProtection, courseController.handleToggleLessonProgress);

// Add Comment to Lesson (Authenticated Users)
router.post('/courses/:courseSlug/lessons/:lessonSlug/comment', userAuthMiddleware, doubleCsrfProtection, courseController.handleAddLessonComment);

module.exports = router;
