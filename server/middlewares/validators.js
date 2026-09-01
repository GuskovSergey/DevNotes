const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
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
    .withMessage('Username or Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const validateRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  handleValidationErrors,
];

const validateChangePassword = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
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
  validateRegister,
  validateProfileUpdate,
  validateChangePassword,
  validateSearch,
};
