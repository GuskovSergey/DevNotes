const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const tagService = require('../services/tagService');
const bookmarkService = require('../services/bookmarkService');
const likeService = require('../services/likeService');
const authService = require('../services/authService');
const commentService = require('../services/commentService');
const readingHistoryService = require('../services/readingHistoryService');
const analyticsService = require('../services/analyticsService');
const notificationService = require('../services/notificationService');
const courseService = require('../services/courseService');
const faqService = require('../services/faqService');
const { User, Post, Comment } = require('../models');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');
const { COOKIE_MAX_AGE } = require('../config/constants');

class UserController {
  getAuthPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Sign In / Register',
      description: 'Sign in to your DevHub account or create a new user profile.',
    };

    res.render('auth', {
      locals,
      activeTab: req.query.tab === 'register' ? 'register' : 'login',
      errorMessage: null,
      successMessage: null,
    });
  });

  handleLogin = catchAsync(async (req, res) => {
    const { username, password } = req.body;

    if (req.validationErrors && req.validationErrors.length > 0) {
      return res.status(400).render('auth', {
        locals: { title: 'Sign In' },
        activeTab: 'login',
        errorMessage: req.validationErrors[0],
        successMessage: null,
      });
    }

    const user = await authService.validateCredentials(username, password);

    if (!user) {
      logger.warn({ username }, 'Failed user login attempt');
      return res.status(401).render('auth', {
        locals: { title: 'Sign In' },
        activeTab: 'login',
        errorMessage: 'Invalid username/email or password.',
        successMessage: null,
      });
    }

    const token = authService.generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    logger.info({ userId: user.id, username: user.username }, 'User logged in successfully');
    
    if (user.role === 'admin') {
      return res.redirect('/dashboard');
    }
    return res.redirect('/account');
  });

  handleRegister = catchAsync(async (req, res) => {
    const { username, email, password, displayName } = req.body;

    if (req.validationErrors && req.validationErrors.length > 0) {
      return res.status(400).render('auth', {
        locals: { title: 'Create Account' },
        activeTab: 'register',
        errorMessage: req.validationErrors[0],
        successMessage: null,
      });
    }

    try {
      const user = await authService.registerUser({
        username,
        email,
        password,
        displayName,
      });

      const token = authService.generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      logger.info({ userId: user.id, username: user.username }, 'New user registered successfully');
      return res.redirect('/account');
    } catch (err) {
      return res.status(err.statusCode || 400).render('auth', {
        locals: { title: 'Create Account' },
        activeTab: 'register',
        errorMessage: err.message || 'Registration failed',
        successMessage: null,
      });
    }
  });

  getAccountPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);

    // Fetch comments made by this user
    const comments = await Comment.findAll({
      where: { userId: req.userId },
      include: [{ model: Post, as: 'post', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
    });

    const userPosts = await postService.getUserPosts(req.userId);
    const userBookmarks = await bookmarkService.getUserBookmarks(req.userId);
    const userLikes = await likeService.getUserLikedPosts(req.userId);
    const analytics = await analyticsService.getAuthorAnalytics(req.userId);
    const faqSubmissions = await faqService.getUserSubmissions(req.userId);

    const locals = {
      title: 'My Profile & Account',
      description: 'Manage your user profile and view your activity.',
    };

    res.render('account/index', {
      locals,
      user,
      activeTab: 'overview',
      comments,
      analytics,
      faqSubmissions,
      stats: {
        postsCount: userPosts.length,
        bookmarksCount: userBookmarks.length,
        likesCount: userLikes.length,
        commentsCount: comments.length,
        faqQuestionsCount: faqSubmissions.questions.length,
        faqAnswersCount: faqSubmissions.answers.length,
      },
      errorMessage: null,
      successMessage: req.query.success || null,
    });
  });

  getEditProfilePage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);

    const locals = {
      title: 'Edit Profile',
      description: 'Update your display name, email, and bio.',
    };

    res.render('account/edit-profile', {
      locals,
      user,
      activeTab: 'settings',
      errorMessage: null,
    });
  });

  handleUpdateProfile = catchAsync(async (req, res) => {
    const { displayName, email, bio, githubUrl, twitterUrl, websiteUrl, oldPassword, newPassword } = req.body;
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (req.validationErrors && req.validationErrors.length > 0) {
      const user = await authService.getUserById(req.userId);
      return res.status(400).render('account/edit-profile', {
        locals: { title: 'Profile Settings' },
        user: { ...user.toJSON(), displayName, email, bio, githubUrl, twitterUrl, websiteUrl },
        errorMessage: req.validationErrors[0],
      });
    }

    try {
      await authService.updateProfile(req.userId, {
        displayName,
        email,
        bio,
        githubUrl,
        twitterUrl,
        websiteUrl,
        avatarUrl,
      });

      // Handle optional password change inside unified settings form
      if (oldPassword && newPassword) {
        await authService.changePassword(req.userId, oldPassword, newPassword);
      }

      return res.redirect('/account?success=Profile & Security settings updated successfully!');
    } catch (err) {
      const user = await authService.getUserById(req.userId);
      return res.status(err.statusCode || 400).render('account/edit-profile', {
        locals: { title: 'Profile Settings' },
        user: { ...user.toJSON(), displayName, email, bio, githubUrl, twitterUrl, websiteUrl },
        errorMessage: err.message || 'Failed to update profile settings',
      });
    }
  });

  getChangePasswordPage = catchAsync(async (req, res) => {
    const locals = {
      title: 'Change Password',
      description: 'Update your account password.',
    };

    res.render('account/change-password', {
      locals,
      errorMessage: null,
    });
  });

  handleChangePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (req.validationErrors && req.validationErrors.length > 0) {
      return res.status(400).render('account/change-password', {
        locals: { title: 'Change Password' },
        errorMessage: req.validationErrors[0],
      });
    }

    try {
      await authService.changePassword(req.userId, oldPassword, newPassword);
      return res.redirect('/account?success=Password changed successfully!');
    } catch (err) {
      return res.status(err.statusCode || 400).render('account/change-password', {
        locals: { title: 'Change Password' },
        errorMessage: err.message || 'Failed to change password',
      });
    }
  });

  getMyPostsPage = catchAsync(async (req, res) => {
    const posts = await postService.getUserPosts(req.userId);
    const user = await authService.getUserById(req.userId);

    const locals = {
      title: 'My Articles',
      description: 'Manage your written articles and check moderation status.',
    };

    res.render('my/posts', {
      locals,
      user,
      activeTab: 'articles',
      posts,
      successMessage: req.query.success || null,
    });
  });

  // User Course Authoring Methods
  getMyCoursesPage = catchAsync(async (req, res) => {
    const courses = await courseService.getUserCourses(req.userId);
    const user = await authService.getUserById(req.userId);

    const locals = {
      title: 'My Courses & Modules',
      description: 'Manage your written courses, lessons, and check moderation status.',
    };

    res.render('my/courses', {
      locals,
      user,
      activeTab: 'courses',
      courses,
      successMessage: req.query.success || null,
    });
  });

  getCreateCoursePage = catchAsync(async (req, res) => {
    const categories = await categoryService.getAllCategories();
    const user = await authService.getUserById(req.userId);

    res.render('my/course-editor', {
      locals: { title: 'Create New Course Track' },
      user,
      categories,
      course: null,
      activeTab: 'courses',
      errorMessage: null,
    });
  });

  handleCreateCourse = catchAsync(async (req, res) => {
    const { title, description, body, difficultyLevel, categoryId, estimatedHours } = req.body;
    const coverImage = req.file ? req.file.filename : null;
    const user = await authService.getUserById(req.userId);

    const status = user.role === 'admin' ? 'published' : 'pending';

    const course = await courseService.createCourse({
      title,
      description,
      body,
      coverImage,
      difficultyLevel,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
      userId: req.userId,
      status,
    });

    const msg = status === 'published'
      ? 'Course created and published successfully!'
      : 'Course submitted successfully and is pending admin moderation.';

    return res.redirect(`/my/courses/${course.id}/edit?success=` + encodeURIComponent(msg));
  });

  getEditMyCoursePage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const course = await courseService.getUserCourseById(id, req.userId);

    if (!course) {
      const error = new Error('Course not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    const categories = await categoryService.getAllCategories();
    const user = await authService.getUserById(req.userId);

    res.render('my/course-editor', {
      locals: { title: `Edit Course: ${course.title}` },
      user,
      categories,
      course,
      activeTab: 'courses',
      successMessage: req.query.success || null,
      errorMessage: null,
    });
  });

  handleUpdateMyCourse = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, body, difficultyLevel, categoryId, estimatedHours } = req.body;
    const coverImage = req.file ? req.file.filename : null;
    const user = await authService.getUserById(req.userId);

    const existingCourse = await courseService.getUserCourseById(id, req.userId);
    if (!existingCourse) {
      const error = new Error('Course not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    const status = user.role === 'admin' ? 'published' : 'pending';

    await courseService.updateCourse(id, {
      title,
      description,
      body,
      coverImage,
      difficultyLevel,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
      status,
    });

    const msg = status === 'published'
      ? 'Course updated successfully!'
      : 'Course updated and submitted for re-moderation.';

    return res.redirect('/my/courses?success=' + encodeURIComponent(msg));
  });

  handleDeleteMyCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.deleteCourse(id, req.userId);
    return res.redirect('/my/courses?success=Course%20deleted%20successfully');
  });

  getCreateMyLessonPage = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;
    const course = await courseService.getUserCourseById(courseId, req.userId);

    if (!course) {
      const error = new Error('Course not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    const user = await authService.getUserById(req.userId);

    res.render('my/lesson-editor', {
      locals: { title: `Add Lesson to ${course.title}` },
      user,
      course,
      lesson: null,
      activeTab: 'courses',
      errorMessage: null,
    });
  });

  handleCreateMyLesson = catchAsync(async (req, res) => {
    const { courseId } = req.params;
    const { title, body, order } = req.body;

    const course = await courseService.getUserCourseById(courseId, req.userId);
    if (!course) {
      return res.redirect('/my/courses');
    }

    await courseService.createLesson(courseId, { title, body, order });
    return res.redirect(`/my/courses/${courseId}/edit?success=Lesson%20added%20successfully`);
  });

  getEditMyLessonPage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const lesson = await courseService.getUserLessonById(id, req.userId);

    if (!lesson) {
      const error = new Error('Lesson not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    const user = await authService.getUserById(req.userId);

    res.render('my/lesson-editor', {
      locals: { title: `Edit Lesson: ${lesson.title}` },
      user,
      course: lesson.course,
      lesson,
      activeTab: 'courses',
      errorMessage: null,
    });
  });

  handleUpdateMyLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, body, order } = req.body;

    const lesson = await courseService.getUserLessonById(id, req.userId);
    if (!lesson) {
      return res.redirect('/my/courses');
    }

    await courseService.updateLesson(id, { title, body, order });
    return res.redirect(`/my/courses/${lesson.courseId}/edit?success=Lesson%20updated%20successfully`);
  });

  handleDeleteMyLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    const lesson = await courseService.getUserLessonById(id, req.userId);
    const courseId = lesson ? lesson.courseId : null;

    if (lesson) {
      await courseService.deleteLesson(id);
    }

    return res.redirect(courseId ? `/my/courses/${courseId}/edit?success=Lesson%20deleted` : '/my/courses');
  });

  getCreatePostPage = catchAsync(async (req, res) => {
    const categories = await categoryService.getAllCategories();
    const locals = {
      title: 'Write New Article',
      description: 'Create a new tech article with Markdown support.',
    };

    res.render('my/editor', {
      locals,
      categories,
      post: null,
      errorMessage: null,
    });
  });

  handleCreatePost = catchAsync(async (req, res) => {
    const { title, body, categoryId, difficultyLevel, tags: tagsInput } = req.body;
    const featuredImage = req.file ? req.file.filename : null;
    const user = await authService.getUserById(req.userId);

    if (req.validationErrors && req.validationErrors.length > 0) {
      const categories = await categoryService.getAllCategories();
      return res.status(400).render('my/editor', {
        locals: { title: 'Write New Article' },
        categories,
        post: { title, body, categoryId, difficultyLevel, tagsInput },
        errorMessage: req.validationErrors[0],
      });
    }

    const tags = await tagService.findOrCreateTags(tagsInput || '');
    const status = user.role === 'admin' ? 'published' : 'pending';

    await postService.createPost({
      title,
      body,
      categoryId,
      featuredImage,
      userId: req.userId,
      tags,
      status,
      difficultyLevel: difficultyLevel || 'Intermediate',
    });

    const msg = status === 'published'
      ? 'Article published successfully!'
      : 'Article submitted successfully and is pending admin moderation.';

    return res.redirect('/my/posts?success=' + encodeURIComponent(msg));
  });

  getEditMyPostPage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await postService.getUserPostById(id, req.userId);

    if (!post) {
      const error = new Error('Article not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    const categories = await categoryService.getAllCategories();
    const locals = {
      title: 'Edit Article',
      description: 'Update your article content and tags.',
    };

    res.render('my/editor', {
      locals,
      categories,
      post,
      errorMessage: null,
    });
  });

  handleUpdateMyPost = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, body, categoryId, difficultyLevel, tags: tagsInput } = req.body;
    const featuredImage = req.file ? req.file.filename : null;
    const user = await authService.getUserById(req.userId);

    const existingPost = await postService.getUserPostById(id, req.userId);
    if (!existingPost) {
      const error = new Error('Article not found or access denied');
      error.statusCode = 404;
      return next(error);
    }

    if (req.validationErrors && req.validationErrors.length > 0) {
      const categories = await categoryService.getAllCategories();
      return res.status(400).render('my/editor', {
        locals: { title: 'Edit Article' },
        categories,
        post: { ...existingPost, title, body, categoryId, difficultyLevel },
        errorMessage: req.validationErrors[0],
      });
    }

    const tags = await tagService.findOrCreateTags(tagsInput || '');
    const status = user.role === 'admin' ? 'published' : 'pending';

    await postService.updatePost(id, {
      title,
      body,
      categoryId,
      featuredImage,
      tags,
      status,
      difficultyLevel: difficultyLevel || 'Intermediate',
    });

    const msg = status === 'published'
      ? 'Article updated successfully!'
      : 'Article updated and submitted for re-moderation.';

    return res.redirect('/my/posts?success=' + encodeURIComponent(msg));
  });

  handleDeleteMyPost = catchAsync(async (req, res) => {
    const { id } = req.params;
    await postService.deletePost(id, req.userId);
    return res.redirect('/my/posts?success=Article%20deleted%20successfully');
  });

  handleToggleBookmark = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const result = await bookmarkService.toggleBookmark(req.userId, postId);

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, ...result });
    }

    const backUrl = req.get('Referrer') || `/post/${postId}`;
    return res.redirect(backUrl);
  });

  getBookmarksPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    const bookmarks = await bookmarkService.getUserBookmarks(req.userId);

    const locals = {
      title: 'Saved Articles (Bookmarks)',
      description: 'View and manage your bookmarked developer articles.',
    };

    res.render('my/bookmarks', {
      locals,
      user,
      activeTab: 'bookmarks',
      posts: bookmarks,
    });
  });

  getLikedPostsPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    const likedPosts = await likeService.getUserLikedPosts(req.userId);

    const locals = {
      title: 'Liked Articles',
      description: 'View all articles you have liked on DevHub.',
    };

    res.render('my/likes', {
      locals,
      user,
      activeTab: 'likes',
      posts: likedPosts,
    });
  });

  getReadingHistoryPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    const history = await readingHistoryService.getUserHistory(req.userId);

    const locals = {
      title: 'Reading History',
      description: 'View articles you have recently read on DevHub.',
    };

    res.render('my/history', {
      locals,
      user,
      activeTab: 'history',
      history,
    });
  });

  getNotificationsPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    const notifications = await notificationService.getUserNotifications(req.userId);

    // Auto mark as read when user views notifications page
    await notificationService.markAllAsRead(req.userId);

    const locals = {
      title: 'Notifications',
      description: 'View your activity notifications and system alerts.',
    };

    res.render('my/notifications', {
      locals,
      user,
      activeTab: 'notifications',
      notifications,
    });
  });

  apiGetNotifications = catchAsync(async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.userId);
    const unreadCount = await notificationService.getUnreadCount(req.userId);
    return res.json({ success: true, notifications, unreadCount });
  });

  apiMarkAllNotificationsRead = catchAsync(async (req, res) => {
    await notificationService.markAllAsRead(req.userId);
    return res.json({ success: true });
  });

  handleMarkAllNotificationsRead = catchAsync(async (req, res) => {
    await notificationService.markAllAsRead(req.userId);
    return res.redirect('/my/notifications');
  });

  handleClearHistory = catchAsync(async (req, res) => {
    await readingHistoryService.clearUserHistory(req.userId);
    return res.redirect('/my/history');
  });

  handleToggleLike = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const result = await likeService.toggleLike(req.userId, postId);

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, ...result });
    }

    const backUrl = req.get('Referrer') || `/post/${postId}`;
    return res.redirect(backUrl);
  });

  getPublicProfilePage = catchAsync(async (req, res, next) => {
    const { username } = req.params;
    const profileUser = await User.findOne({ where: { username } });

    if (!profileUser) {
      const error = new Error('Author not found');
      error.statusCode = 404;
      return next(error);
    }

    const posts = await postService.getUserPosts(profileUser.id);
    const publishedPosts = posts.filter(p => p.status === 'published');
    const totalViews = publishedPosts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalComments = await Comment.count({ where: { userId: profileUser.id, isApproved: true } });

    const locals = {
      title: `${profileUser.displayName || profileUser.username} (@${profileUser.username})`,
      description: profileUser.bio || `Developer profile of ${profileUser.displayName || profileUser.username} on DevHub.`,
    };

    res.render('profile', {
      locals,
      profileUser,
      posts: publishedPosts,
      stats: {
        totalArticles: publishedPosts.length,
        totalViews,
        totalComments,
      },
    });
  });

  getAskQuestionPage = catchAsync(async (req, res) => {
    const user = await authService.getUserById(req.userId);
    const locals = {
      title: 'Ask a Technical Question | DevHub',
      description: 'Submit an interview question or technical query for moderation.',
    };

    res.render('my/ask-question', {
      locals,
      user,
      activeTab: 'my-questions',
    });
  });

  handleAskQuestion = catchAsync(async (req, res) => {
    await faqService.submitUserQuestion(req.userId, req.body);
    res.redirect('/my/questions?success=Your question has been submitted for moderation!');
  });

  handleAnswerSubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;
    if (answer && answer.trim()) {
      await faqService.submitUserAnswer(req.userId, id, answer);
    }
    res.redirect('/faq?success=Your community answer has been submitted for moderation!');
  });

  getMyQuestionsPage = catchAsync(async (req, res) => {
    const submissions = await faqService.getUserSubmissions(req.userId);
    const user = await authService.getUserById(req.userId);
    const locals = {
      title: 'My Q&A Submissions | DevHub Cabinet',
      description: 'View status of your submitted questions and answers.',
    };

    res.render('my/my-questions', {
      locals,
      user,
      activeTab: 'my-questions',
      questions: submissions.questions,
      answers: submissions.answers,
      successMessage: req.query.success || null,
    });
  });

  handleLogout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
  });
}

module.exports = new UserController();
