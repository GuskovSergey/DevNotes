const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      statusCode,
    },
    url: req.originalUrl,
    method: req.method,
  }, 'Unhandled Error encountered in Express pipeline');

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

  // Handle 500 and other server errors
  return res.status(statusCode).render('errors/500', {
    currentRoute: req.originalUrl,
    locals: { title: '500 - Internal Server Error' },
    error: process.env.NODE_ENV === 'development' ? err : null,
  });
};

module.exports = errorHandler;
