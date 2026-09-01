const authService = require('../services/authService');
const categoryService = require('../services/categoryService');
const logger = require('../config/logger');

// Strict Admin-only Middleware
const adminAuthMiddleware = async (req, res, next) => {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    logger.warn({ url: req.originalUrl }, 'Unauthorized admin access attempt without token');
    return res.status(401).redirect('/admin');
  }

  try {
    const decoded = authService.verifyToken(token);
    const user = await authService.getUserById(decoded.userId);

    if (!user || user.role !== 'admin') {
      logger.warn({ userId: decoded.userId, role: user?.role }, 'Forbidden admin access attempt');
      return res.status(403).render('errors/500', {
        locals: { title: 'Access Denied' },
        error: { message: 'Access denied: Admin privileges required.' },
      });
    }

    req.userId = user.id;
    req.userRole = user.role;
    res.locals.currentUser = user;
    return next();
  } catch (error) {
    logger.warn({ err: error.message }, 'Invalid authentication token during admin check');
    res.clearCookie('token');
    return res.status(401).redirect('/admin');
  }
};

// Logged-in User (user or admin) Middleware
const userAuthMiddleware = async (req, res, next) => {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    return res.status(401).redirect('/auth');
  }

  try {
    const decoded = authService.verifyToken(token);
    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      res.clearCookie('token');
      return res.status(401).redirect('/auth');
    }

    req.userId = user.id;
    req.userRole = user.role;
    res.locals.currentUser = user;
    return next();
  } catch (error) {
    logger.warn({ err: error.message }, 'Invalid user authentication token');
    res.clearCookie('token');
    return res.status(401).redirect('/auth');
  }
};

// Soft/Optional Authentication Middleware (attaches currentUser & categories to locals)
const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.cookies ? req.cookies.token : null;

  if (token) {
    try {
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.userId);
      if (user) {
        req.userId = user.id;
        req.userRole = user.role;
        res.locals.currentUser = user;
      }
    } catch (error) {
      res.clearCookie('token');
    }
  }

  if (!res.locals.currentUser) {
    res.locals.currentUser = null;
  }

  try {
    res.locals.categories = await categoryService.getAllCategories();
  } catch (err) {
    res.locals.categories = [];
  }

  next();
};

module.exports = {
  adminAuthMiddleware,
  userAuthMiddleware,
  optionalAuthMiddleware,
};
