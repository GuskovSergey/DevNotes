const authService = require('../services/authService');
const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const commentService = require('../services/commentService');
const tagService = require('../services/tagService');
const notificationService = require('../services/notificationService');
const courseService = require('../services/courseService');
const faqService = require('../services/faqService');
const { Lesson, InterviewQuestion } = require('../models');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');
const { COOKIE_MAX_AGE } = require('../config/constants');

const adminLayout = '../views/layouts/admin';

class AdminController {
  getLoginPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Admin Login',
      description: 'Admin login page for NodeJs Blog.',
    };

    res.render('admin/index', {
      locals,
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleLogin = catchAsync(async (req, res) => {
    const { username, password } = req.body;

    if (req.validationErrors && req.validationErrors.length > 0) {
      return res.status(400).render('admin/index', {
        locals: { title: 'Admin Login' },
        layout: adminLayout,
        errorMessage: req.validationErrors[0],
      });
    }

    const user = await authService.validateCredentials(username, password);

    if (!user) {
      logger.warn({ username }, 'Failed login attempt');
      return res.status(401).render('admin/index', {
        locals: { title: 'Admin Login' },
        layout: adminLayout,
        errorMessage: 'Invalid username or password.',
      });
    }

    if (user.role !== 'admin') {
      logger.warn({ username }, 'Non-admin user attempted admin login');
      return res.status(403).render('admin/index', {
        locals: { title: 'Admin Login' },
        layout: adminLayout,
        errorMessage: 'Access denied: Administrator privileges required.',
      });
    }

    const token = authService.generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.redirect('/dashboard');
  });

  getDashboard = catchAsync(async (req, res) => {
    const locals = {
      title: 'Dashboard',
      description: 'Admin Dashboard',
    };

    const data = await postService.getAllPosts();
    const totalPosts = await postService.getTotalCount();
    const totalViews = await postService.getTotalViews();
    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();
    const pendingCoursesCount = await courseService.getPendingCoursesCount();
    const totalCourses = await courseService.getCoursesCount();

    res.render('admin/dashboard', {
      locals,
      data,
      activeTab: 'overview',
      analytics: {
        totalPosts,
        totalViews,
        pendingCommentsCount,
        pendingPostsCount,
        pendingCoursesCount,
        totalCourses,
      },
      layout: adminLayout,
    });
  });

  getAddPostPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Add Post',
      description: 'Create a new blog post',
    };

    const categories = await categoryService.getAllCategories();

    res.render('admin/add-post', {
      locals,
      categories,
      activeTab: 'add-post',
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAddPost = catchAsync(async (req, res) => {
    const { title, body, categoryId, tags: tagsInput } = req.body;
    const featuredImage = req.file ? req.file.filename : null;

    if (req.validationErrors && req.validationErrors.length > 0) {
      const categories = await categoryService.getAllCategories();
      return res.status(400).render('admin/add-post', {
        locals: { title: 'Add Post' },
        categories,
        layout: adminLayout,
        errorMessage: req.validationErrors[0],
      });
    }

    const tags = await tagService.findOrCreateTags(tagsInput || '');

    await postService.createPost({
      title,
      body,
      categoryId,
      featuredImage,
      userId: req.userId,
      tags,
    });

    return res.redirect('/dashboard');
  });

  getEditPostPage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const data = await postService.getPostById(id);

    if (!data) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    const categories = await categoryService.getAllCategories();
    const locals = {
      title: 'Edit Post',
      description: 'Edit existing blog post',
    };

    res.render('admin/edit-post', {
      locals,
      data,
      categories,
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleEditPost = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, body, categoryId, tags: tagsInput } = req.body;
    const featuredImage = req.file ? req.file.filename : null;

    if (req.validationErrors && req.validationErrors.length > 0) {
      const data = await postService.getPostById(id);
      const categories = await categoryService.getAllCategories();
      return res.status(400).render('admin/edit-post', {
        locals: { title: 'Edit Post' },
        data: data || { id, title, body },
        categories,
        layout: adminLayout,
        errorMessage: req.validationErrors[0],
      });
    }

    const tags = await tagService.findOrCreateTags(tagsInput || '');

    const updatedPost = await postService.updatePost(id, {
      title,
      body,
      categoryId,
      featuredImage,
      tags,
    });

    if (!updatedPost) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    return res.redirect(`/edit-post/${id}`);
  });

  handleDeletePost = catchAsync(async (req, res) => {
    const { id } = req.params;
    await postService.deletePost(id);
    return res.redirect('/dashboard');
  });

  // Comments Moderation Methods
  getCommentsPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Comments Moderation',
      description: 'Manage & moderate comments',
    };

    const comments = await commentService.getAllComments();

    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();

    res.render('admin/comments', {
      locals,
      comments,
      activeTab: 'comments',
      analytics: { pendingCommentsCount, pendingPostsCount },
      layout: adminLayout,
    });
  });

  handleApproveComment = catchAsync(async (req, res) => {
    const { id } = req.params;
    await commentService.approveComment(id);
    return res.redirect('/admin/comments');
  });

  handleDeleteComment = catchAsync(async (req, res) => {
    const { id } = req.params;
    await commentService.deleteComment(id);
    return res.redirect('/admin/comments');
  });

  // Post Moderation Methods
  getPendingPostsPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Article Moderation',
      description: 'Review and moderate articles submitted by community members.',
    };

    const posts = await postService.getPendingPosts();

    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();

    res.render('admin/pending-posts', {
      locals,
      posts,
      activeTab: 'queue',
      analytics: { pendingCommentsCount, pendingPostsCount },
      layout: adminLayout,
    });
  });

  handleApprovePost = catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    await postService.approvePost(id);

    if (post && post.author && post.author.id) {
      await notificationService.createNotification({
        userId: post.author.id,
        type: 'moderation_approved',
        message: `Your article "${post.title}" has been approved and published! 🎉`,
        link: `/post/${id}`,
      });
    }

    return res.redirect('/admin/posts/pending');
  });

  handleRejectPost = catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    await postService.rejectPost(id);

    if (post && post.author && post.author.id) {
      await notificationService.createNotification({
        userId: post.author.id,
        type: 'moderation_rejected',
        message: `Your article "${post.title}" was rejected during moderation.`,
        link: `/my/posts`,
      });
    }

    return res.redirect('/admin/posts/pending');
  });

  // Course Moderation Methods
  getPendingCoursesPage = catchAsync(async (req, res) => {
    const courses = await courseService.getPendingCourses();
    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();
    const pendingCoursesCount = await courseService.getPendingCoursesCount();

    res.render('admin/pending-courses', {
      locals: { title: 'Course Moderation Queue | DevHub Admin' },
      courses,
      activeTab: 'course-queue',
      analytics: { pendingCommentsCount, pendingPostsCount, pendingCoursesCount },
      layout: adminLayout,
    });
  });

  handleApproveCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const course = await courseService.approveCourse(id);

    if (course && course.author && course.author.id) {
      await notificationService.createNotification({
        userId: course.author.id,
        type: 'moderation_approved',
        message: `Your course "${course.title}" has been approved and published! 🎓`,
        link: `/courses/${course.slug}`,
      });
    }

    return res.redirect('/admin/courses/pending');
  });

  handleRejectCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const course = await courseService.rejectCourse(id);

    if (course && course.author && course.author.id) {
      await notificationService.createNotification({
        userId: course.author.id,
        type: 'moderation_rejected',
        message: `Your course "${course.title}" was rejected during moderation.`,
        link: `/my/courses`,
      });
    }

    return res.redirect('/admin/courses/pending');
  });

  // Course Administration Methods
  getAdminCoursesPage = catchAsync(async (req, res) => {
    const courses = await courseService.getAllCoursesAdmin();
    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();
    const pendingCoursesCount = await courseService.getPendingCoursesCount();

    res.render('admin/courses', {
      locals: { title: 'Manage Courses | DevHub Admin' },
      courses,
      activeTab: 'courses',
      analytics: { pendingCommentsCount, pendingPostsCount, pendingCoursesCount },
      layout: adminLayout,
    });
  });

  getAdminAddCoursePage = catchAsync(async (req, res) => {
    const categories = await categoryService.getAllCategories();
    res.render('admin/add-course', {
      locals: { title: 'Add New Course | DevHub Admin' },
      categories,
      activeTab: 'courses',
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAdminAddCourse = catchAsync(async (req, res) => {
    const { title, description, body, difficultyLevel, categoryId, estimatedHours } = req.body;
    const coverImage = req.file ? req.file.filename : null;

    await courseService.createCourse({
      title,
      description,
      body,
      coverImage,
      difficultyLevel,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
      userId: req.userId,
    });

    return res.redirect('/admin/courses');
  });

  getAdminEditCoursePage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);
    if (!course) return next(new Error('Course not found'));

    const categories = await categoryService.getAllCategories();
    res.render('admin/edit-course', {
      locals: { title: `Edit Course: ${course.title}` },
      course,
      categories,
      activeTab: 'courses',
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAdminEditCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, body, difficultyLevel, categoryId, estimatedHours } = req.body;
    const coverImage = req.file ? req.file.filename : null;

    await courseService.updateCourse(id, {
      title,
      description,
      body,
      coverImage,
      difficultyLevel,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
    });

    return res.redirect(`/admin/courses/${id}/edit`);
  });

  handleAdminDeleteCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.deleteCourse(id);
    return res.redirect('/admin/courses');
  });

  getAdminAddLessonPage = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const course = await courseService.getCourseById(courseId);
    if (!course) return next(new Error('Course not found'));

    res.render('admin/add-lesson', {
      locals: { title: `Add Lesson to ${course.title}` },
      course,
      activeTab: 'courses',
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAdminAddLesson = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const { title, body, order } = req.body;

    await courseService.createLesson(courseId, { title, body, order });
    return res.redirect(`/admin/courses/${courseId}/edit`);
  });

  getAdminEditLessonPage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return next(new Error('Lesson not found'));

    res.render('admin/edit-lesson', {
      locals: { title: `Edit Lesson: ${lesson.title}` },
      lesson,
      activeTab: 'courses',
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAdminEditLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, body, order } = req.body;

    const lesson = await courseService.updateLesson(id, { title, body, order });
    return res.redirect(`/admin/courses/${lesson ? lesson.courseId : ''}/edit`);
  });

  handleAdminDeleteLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    const lesson = await Lesson.findByPk(id);
    const courseId = lesson ? lesson.courseId : null;
    await courseService.deleteLesson(id);

    return res.redirect(courseId ? `/admin/courses/${courseId}/edit` : '/admin/courses');
  });

  handleLogout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
  });

  getFaqListPage = catchAsync(async (req, res) => {
    const questions = await faqService.getAdminAllQuestions();
    const locals = { title: 'Manage Technical Interview Q&A | Admin' };

    res.render('admin/faq', {
      locals,
      questions,
      layout: adminLayout,
      activeTab: 'faq',
      currentUser: res.locals.currentUser || null,
    });
  });

  getAddFaqPage = catchAsync(async (req, res) => {
    const locals = { title: 'Add New Interview Question | Admin' };

    res.render('admin/add-faq', {
      locals,
      layout: adminLayout,
      activeTab: 'faq',
      currentUser: res.locals.currentUser || null,
    });
  });

  createFaqQuestion = catchAsync(async (req, res) => {
    await faqService.createQuestion(req.body);
    res.redirect('/admin/faq');
  });

  getEditFaqPage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return res.redirect('/admin/faq');

    const locals = { title: `Edit Interview Question #${id} | Admin` };

    res.render('admin/edit-faq', {
      locals,
      question: question.get({ plain: true }),
      layout: adminLayout,
      activeTab: 'faq',
      currentUser: res.locals.currentUser || null,
    });
  });

  updateFaqQuestion = catchAsync(async (req, res) => {
    const { id } = req.params;
    await faqService.updateQuestion(id, req.body);
    res.redirect('/admin/faq');
  });

  deleteFaqQuestion = catchAsync(async (req, res) => {
    const { id } = req.params;
    await faqService.deleteQuestion(id);
    res.redirect('/admin/faq');
  });

  getPendingFaqPage = catchAsync(async (req, res) => {
    const submissions = await faqService.getPendingSubmissions();
    const pendingFaqCount = await faqService.getPendingFaqCount();
    const locals = { title: 'Q&A Moderation Queue | Admin' };

    res.render('admin/pending-faq', {
      locals,
      questions: submissions.questions,
      answers: submissions.answers,
      analytics: { pendingFaqCount },
      layout: adminLayout,
      activeTab: 'faq-queue',
      currentUser: res.locals.currentUser || null,
    });
  });

  handleApproveFaqQuestion = catchAsync(async (req, res) => {
    const { id } = req.params;
    await faqService.approveQuestion(id);
    res.redirect('/admin/faq/pending');
  });

  handleRejectFaqQuestion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    await faqService.rejectQuestion(id, reason);
    res.redirect('/admin/faq/pending');
  });

  handleApproveFaqAnswer = catchAsync(async (req, res) => {
    const { id } = req.params;
    await faqService.approveAnswer(id);
    res.redirect('/admin/faq/pending');
  });

  handleRejectFaqAnswer = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    await faqService.rejectAnswer(id, reason);
    res.redirect('/admin/faq/pending');
  });

  getUsersPage = catchAsync(async (req, res) => {
    const users = await authService.getAllUsers();
    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();
    const pendingCoursesCount = await courseService.getPendingCoursesCount();

    res.render('admin/users', {
      locals: { title: 'User Management | DevHub Admin' },
      users,
      activeTab: 'users',
      analytics: { pendingCommentsCount, pendingPostsCount, pendingCoursesCount },
      layout: adminLayout,
    });
  });

  getOptionsPage = catchAsync(async (req, res) => {
    const categories = await categoryService.getAllCategoriesWithCounts();
    const tags = await tagService.getAllTagsWithCounts();
    const pendingCommentsCount = await commentService.getPendingCount();
    const pendingPostsCount = await postService.getPendingCount();
    const pendingCoursesCount = await courseService.getPendingCoursesCount();

    const activeSubTab = req.query.tab === 'tags' ? 'tags' : 'categories';

    res.render('admin/options', {
      locals: { title: 'Options & Taxonomy Management | DevHub Admin' },
      categories,
      tags,
      activeSubTab,
      activeTab: 'options',
      analytics: { pendingCommentsCount, pendingPostsCount, pendingCoursesCount },
      layout: adminLayout,
    });
  });

  handleAddCategory = catchAsync(async (req, res) => {
    const { name, slug } = req.body;
    if (name) {
      await categoryService.createCategory({ name, slug });
    }
    res.redirect('/admin/categories?tab=categories');
  });

  handleEditCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, slug } = req.body;
    await categoryService.updateCategory(id, { name, slug });
    res.redirect('/admin/categories?tab=categories');
  });

  handleDeleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.redirect('/admin/categories?tab=categories');
  });

  handleAddTag = catchAsync(async (req, res) => {
    const { name, slug } = req.body;
    if (name) {
      await tagService.createTag({ name, slug });
    }
    res.redirect('/admin/categories?tab=tags');
  });

  handleEditTag = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, slug } = req.body;
    await tagService.updateTag(id, { name, slug });
    res.redirect('/admin/categories?tab=tags');
  });

  handleDeleteTag = catchAsync(async (req, res) => {
    const { id } = req.params;
    await tagService.deleteTag(id);
    res.redirect('/admin/categories?tab=tags');
  });
}

module.exports = new AdminController();
