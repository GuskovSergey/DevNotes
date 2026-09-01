const { doubleCsrf } = require('csrf-csrf');

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'fallback_secret_change_me',
  getSessionIdentifier: (req) => (req.session ? req.session.id : ''),
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  getTokenFromRequest: (req) => {
    return req.body ? req.body._csrf : req.headers['x-csrf-token'];
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
