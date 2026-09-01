const authService = require('../services/authService');
const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const commentService = require('../services/commentService');
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
        errorMessage: 'Invalid credentials',
      });
    }

    const token = authService.generateToken(user.id);
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

    res.render('admin/dashboard', {
      locals,
      data,
      analytics: {
        totalPosts,
        totalViews,
        pendingCommentsCount,
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
      layout: adminLayout,
      errorMessage: null,
    });
  });

  handleAddPost = catchAsync(async (req, res) => {
    const { title, body, categoryId } = req.body;
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

    await postService.createPost({
      title,
      body,
      categoryId,
      featuredImage,
      userId: req.userId,
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
    const { title, body, categoryId } = req.body;
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

    const updatedPost = await postService.updatePost(id, {
      title,
      body,
      categoryId,
      featuredImage,
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

    res.render('admin/comments', {
      locals,
      comments,
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

  handleLogout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
  });
}

module.exports = new AdminController();
