const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const tagService = require('../services/tagService');
const authService = require('../services/authService');
const commentService = require('../services/commentService');
const { Comment, Post } = require('../models');
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

    const locals = {
      title: 'My Profile & Account',
      description: 'Manage your user profile and view your activity.',
    };

    res.render('account/index', {
      locals,
      user,
      comments,
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
      errorMessage: null,
    });
  });

  handleUpdateProfile = catchAsync(async (req, res) => {
    const { displayName, email, bio } = req.body;

    if (req.validationErrors && req.validationErrors.length > 0) {
      const user = await authService.getUserById(req.userId);
      return res.status(400).render('account/edit-profile', {
        locals: { title: 'Edit Profile' },
        user: { ...user.toJSON(), displayName, email, bio },
        errorMessage: req.validationErrors[0],
      });
    }

    try {
      await authService.updateProfile(req.userId, { displayName, email, bio });
      return res.redirect('/account?success=Profile updated successfully!');
    } catch (err) {
      const user = await authService.getUserById(req.userId);
      return res.status(err.statusCode || 400).render('account/edit-profile', {
        locals: { title: 'Edit Profile' },
        user: { ...user.toJSON(), displayName, email, bio },
        errorMessage: err.message || 'Failed to update profile',
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
      posts,
      successMessage: req.query.success || null,
    });
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
    const { title, body, categoryId, tags: tagsInput } = req.body;
    const featuredImage = req.file ? req.file.filename : null;
    const user = await authService.getUserById(req.userId);

    if (req.validationErrors && req.validationErrors.length > 0) {
      const categories = await categoryService.getAllCategories();
      return res.status(400).render('my/editor', {
        locals: { title: 'Write New Article' },
        categories,
        post: { title, body, categoryId, tagsInput },
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
    const { title, body, categoryId, tags: tagsInput } = req.body;
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
        post: { ...existingPost, title, body, categoryId },
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

  handleLogout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
  });
}

module.exports = new UserController();
