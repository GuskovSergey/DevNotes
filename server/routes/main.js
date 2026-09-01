const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const { optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validateSearch } = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

router.get('', optionalAuthMiddleware, mainController.getHomePage);
router.get('/post/:id', optionalAuthMiddleware, mainController.getPostPage);
router.post('/post/:id/comment', optionalAuthMiddleware, doubleCsrfProtection, mainController.addComment);
router.post('/search', optionalAuthMiddleware, validateSearch, mainController.searchPosts);
router.get('/about', optionalAuthMiddleware, mainController.getAboutPage);
router.get('/tag/:slug', optionalAuthMiddleware, mainController.getTagPage);

module.exports = router;
