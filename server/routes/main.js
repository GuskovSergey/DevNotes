const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const { validateSearch } = require('../middlewares/validators');
const { doubleCsrfProtection } = require('../middlewares/csrfMiddleware');

router.get('', mainController.getHomePage);
router.get('/post/:id', mainController.getPostPage);
router.post('/post/:id/comment', doubleCsrfProtection, mainController.addComment);
router.post('/search', validateSearch, mainController.searchPosts);
router.get('/about', mainController.getAboutPage);
router.get('/tag/:slug', mainController.getTagPage);

module.exports = router;
