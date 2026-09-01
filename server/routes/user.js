const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { userAuthMiddleware } = require('../middlewares/authMiddleware');
const {
  validateAuth,
  validateRegister,
  validateProfileUpdate,
  validateChangePassword,
} = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

// Public Auth routes
router.get('/auth', userController.getAuthPage);
router.post('/auth/login', validateAuth, doubleCsrfProtection, userController.handleLogin);
router.post('/auth/register', validateRegister, doubleCsrfProtection, userController.handleRegister);
router.get('/auth/logout', userController.handleLogout);

// Protected User Account routes
router.get('/account', userAuthMiddleware, userController.getAccountPage);
router.get('/account/edit', userAuthMiddleware, userController.getEditProfilePage);
router.put('/account/profile', userAuthMiddleware, validateProfileUpdate, doubleCsrfProtection, userController.handleUpdateProfile);
router.get('/account/password', userAuthMiddleware, userController.getChangePasswordPage);
router.put('/account/password', userAuthMiddleware, validateChangePassword, doubleCsrfProtection, userController.handleChangePassword);

module.exports = router;
