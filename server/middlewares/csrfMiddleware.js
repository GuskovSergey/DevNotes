const { doubleCsrf } = require('csrf-csrf');

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'fallback_secret_change_me',
  getSessionIdentifier: (req) => {
    if (req.userId) return String(req.userId);
    return 'devhub_guest_session';
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  getCsrfTokenFromRequest: (req) => {
    return req.body && req.body._csrf ? req.body._csrf : req.headers['x-csrf-token'];
  },
});

const attachCsrfToken = (req, res, next) => {
  res.locals.csrfToken = generateCsrfToken(req, res);
  next();
};

module.exports = {
  doubleCsrfProtection,
  attachCsrfToken,
  invalidCsrfTokenError,
};
