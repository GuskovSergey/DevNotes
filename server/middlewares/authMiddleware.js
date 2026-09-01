const authService = require('../services/authService');
const logger = require('../config/logger');

const authMiddleware = (req, res, next) => {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    logger.warn({ url: req.originalUrl }, 'Unauthorized access attempt without token');
    return res.status(401).redirect('/admin');
  }

  try {
    const decoded = authService.verifyToken(token);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    logger.warn({ err: error.message }, 'Invalid authentication token');
    res.clearCookie('token');
    return res.status(401).redirect('/admin');
  }
};

module.exports = authMiddleware;
