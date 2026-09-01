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

  handleLogout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
  });
}

module.exports = new UserController();
