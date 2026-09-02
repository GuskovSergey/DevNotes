const courseService = require('../services/courseService');
const commentService = require('../services/commentService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class CourseController {
  /**
   * GET /courses - Public Courses Hub Catalog Page
   */
  getCoursesHub = catchAsync(async (req, res) => {
    const userId = req.userId || null;
    const courses = await courseService.getAllPublishedCourses(userId);

    const locals = {
      title: 'Knowledge Base & Engineering Courses | DevHub',
      description: 'Production-ready Node.js, SQLite, and backend architecture courses.',
      currentRoute: '/courses',
    };

    res.render('courses', {
      locals,
      courses,
      activeDifficulty: req.query.difficulty || null,
      currentUser: res.locals.currentUser || null,
    });
  });

  /**
   * GET /courses/:slug - Course Overview Page & Table of Contents
   */
  getCoursePage = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const userId = req.userId || null;
    const course = await courseService.getCourseBySlug(slug, userId);

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      return next(error);
    }

    const locals = {
      title: `${course.title} | DevHub Knowledge Base`,
      description: course.descriptionSnippet || course.title,
      currentRoute: '/courses',
    };

    res.render('course', {
      locals,
      course,
      currentUser: res.locals.currentUser || null,
    });
  });

  /**
   * GET /courses/:courseSlug/lessons/:lessonSlug - Single Lesson Reader Page
   */
  getLessonPage = catchAsync(async (req, res, next) => {
    const { courseSlug, lessonSlug } = req.params;
    const userId = req.userId || null;

    const lesson = await courseService.getLessonBySlug(courseSlug, lessonSlug, userId);

    if (!lesson) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      return next(error);
    }

    const locals = {
      title: `${lesson.title} - ${lesson.course ? lesson.course.title : 'Course'} | DevHub`,
      description: `Lesson ${lesson.order}: ${lesson.title}`,
      currentRoute: '/courses',
    };

    res.render('lesson', {
      locals,
      lesson,
      currentUser: res.locals.currentUser || null,
    });
  });

  /**
   * POST /courses/:courseSlug/lessons/:lessonSlug/complete - Toggle Lesson Progress (AJAX / Form)
   */
  handleToggleLessonProgress = catchAsync(async (req, res) => {
    const { courseId, lessonId } = req.body;
    const userId = req.userId;

    if (!userId) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      return res.redirect('/auth');
    }

    const result = await courseService.toggleLessonProgress(userId, parseInt(courseId, 10), parseInt(lessonId, 10));

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, completed: result.completed });
    }

    return res.redirect(req.get('Referrer') || '/courses');
  });

  /**
   * POST /courses/:courseSlug/lessons/:lessonSlug/comment - Add Comment to Lesson
   */
  handleAddLessonComment = catchAsync(async (req, res) => {
    const { lessonId, content, parentId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.redirect('/auth');
    }

    const currentUser = res.locals.currentUser;
    const authorName = currentUser ? (currentUser.displayName || currentUser.username) : 'Developer';
    const authorEmail = currentUser ? currentUser.email : 'dev@devhub.com';

    await commentService.createComment({
      lessonId: parseInt(lessonId, 10),
      userId,
      authorName,
      authorEmail,
      content,
      parentId: parentId ? parseInt(parentId, 10) : null,
    });

    return res.redirect(req.get('Referrer') || '/courses');
  });
}

module.exports = new CourseController();
