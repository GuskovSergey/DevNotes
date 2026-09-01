const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const commentService = require('../services/commentService');
const tagService = require('../services/tagService');
const bookmarkService = require('../services/bookmarkService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class MainController {
  getHomePage = catchAsync(async (req, res) => {
    const categorySlug = req.query.category || null;
    const locals = {
      title: 'NodeJs Blog',
      description: 'Simple Blog created with NodeJs, Express & SQLite.',
    };

    const { data, current, nextPage } = await postService.getPaginatedPosts(req.query.page, 10, categorySlug);
    const categories = await categoryService.getAllCategories();

    res.render('index', {
      locals,
      data,
      current,
      nextPage,
      categories,
      activeCategory: categorySlug,
      currentRoute: '/',
    });
  });

  getPostPage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    // Increment view count when post is visited
    const data = await postService.getPostById(id, true);

    if (!data) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    const isBookmarked = res.locals.currentUser
      ? await bookmarkService.isBookmarked(res.locals.currentUser.id, id)
      : false;

    const locals = {
      title: data.title,
      description: 'Simple Blog created with NodeJs, Express & SQLite.',
    };

    res.render('post', {
      locals,
      data,
      isBookmarked,
      currentRoute: `/post/${id}`,
      successMessage: req.query.commentAdded ? 'Thank you! Your comment has been submitted and is pending moderation.' : null,
    });
  });

  addComment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { content } = req.body;
    const currentUser = res.locals.currentUser;

    let authorName = req.body.authorName;
    let authorEmail = req.body.authorEmail;
    let userId = null;

    if (currentUser) {
      authorName = currentUser.displayName || currentUser.username;
      authorEmail = currentUser.email;
      userId = currentUser.id;
    }

    if (!authorName || !authorEmail || !content) {
      logger.warn({ postId: id }, 'Incomplete comment submission');
      return res.redirect(`/post/${id}?commentError=1`);
    }

    await commentService.addComment({
      postId: parseInt(id, 10),
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      userId,
    });

    logger.info({ postId: id, userId }, 'New comment submitted for moderation');
    return res.redirect(`/post/${id}?commentAdded=1`);
  });

  searchPosts = catchAsync(async (req, res) => {
    const locals = {
      title: 'Search',
      description: 'Simple Blog created with NodeJs, Express & SQLite.',
    };

    const searchTerm = req.body.searchTerm || '';
    const data = await postService.searchPosts(searchTerm);

    res.render('search', {
      data,
      locals,
      currentRoute: '/',
    });
  });

  getAboutPage = catchAsync(async (req, res) => {
    res.render('about', {
      currentRoute: '/about',
      locals: {
        title: 'About Us',
        description: 'About NodeJs Blog.',
      },
    });
  });

  getTagPage = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const { tag, data, current, nextPage } = await tagService.getPostsByTag(slug, req.query.page);

    if (!tag) {
      const error = new Error('Tag not found');
      error.statusCode = 404;
      return next(error);
    }

    const locals = {
      title: `#${tag.name} — Articles`,
      description: `Browse all articles tagged with #${tag.name} on DevHub.`,
    };

    res.render('tag', {
      locals,
      tag,
      data,
      current,
      nextPage,
      currentRoute: `/tag/${slug}`,
    });
  });
}

module.exports = new MainController();

