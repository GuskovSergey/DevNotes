const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    // If request accepts HTML/EJS response or is form submission
    req.validationErrors = errorMessages;
  }
  next();
};

const validatePost = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Post body content is required'),
  handleValidationErrors,
];

const validateAuth = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const validateSearch = [
  body('searchTerm')
    .trim()
    .escape(),
  handleValidationErrors,
];

module.exports = {
  validatePost,
  validateAuth,
  validateSearch,
};
