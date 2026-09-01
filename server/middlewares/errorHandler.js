const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  if (err.message === 'invalid csrf token' || err.code === 'EBADCSRFTOKEN') {
    err.statusCode = 403;
    err.message = 'Form security token mismatch. Please refresh the page and try again.';
  }

  const statusCode = err.statusCode || err.status || 500;

  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      statusCode,
    },
    url: req.originalUrl,
    method: req.method,
  }, 'Error encountered in Express pipeline');

  if (res.headersSent) {
    return next(err);
  }

  // Handle 404
  if (statusCode === 404) {
    return res.status(404).render('errors/404', {
      currentRoute: req.originalUrl,
      locals: { title: '404 - Page Not Found' },
    });
  }

  // Handle 403 / 500
  return res.status(statusCode).render('errors/500', {
    currentRoute: req.originalUrl,
    locals: { title: `${statusCode} - ${statusCode === 403 ? 'Security Mismatch' : 'Internal Server Error'}` },
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null,
    },
  });
};

module.exports = errorHandler;
