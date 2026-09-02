const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const commentService = require('../services/commentService');
const tagService = require('../services/tagService');
const bookmarkService = require('../services/bookmarkService');
const likeService = require('../services/likeService');
const readingHistoryService = require('../services/readingHistoryService');
const notificationService = require('../services/notificationService');
const { Post, Comment: CommentModel } = require('../models');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

class MainController {
  getHomePage = catchAsync(async (req, res) => {
    const categorySlug = req.query.category || null;
    const locals = {
      title: 'DevHub — Production Backend Architecture & Node.js Engineering',
      description: 'Production-grade backend architecture, Express MVC patterns, SQLite performance tuning, and technical tutorials.',
    };

    const { data, current, nextPage } = await postService.getPaginatedPosts(req.query.page, 10, categorySlug);
    const categories = await categoryService.getAllCategories();
    const popularPosts = await postService.getPopularPosts(3);
    const popularTags = await tagService.getAllTags();
    const topAuthors = await postService.getTopAuthors(4);

    res.render('index', {
      locals,
      data,
      current,
      nextPage,
      categories,
      popularPosts,
      popularTags: popularTags.slice(0, 8),
      topAuthors,
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

    if (res.locals.currentUser) {
      await readingHistoryService.recordVisit(res.locals.currentUser.id, id);
    }

    const isBookmarked = res.locals.currentUser
      ? await bookmarkService.isBookmarked(res.locals.currentUser.id, id)
      : false;

    const isLiked = res.locals.currentUser
      ? await likeService.isLiked(res.locals.currentUser.id, id)
      : false;

    const locals = {
      title: data.title,
      description: 'Simple Blog created with NodeJs, Express & SQLite.',
    };

    res.render('post', {
      locals,
      data,
      isBookmarked,
      isLiked,
      currentRoute: `/post/${id}`,
      successMessage: req.query.commentAdded ? 'Thank you! Your comment has been submitted and is pending moderation.' : null,
    });
  });

  addComment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { content, parentId } = req.body;
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

    const newComment = await commentService.addComment({
      postId: parseInt(id, 10),
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      userId,
      parentId: parentId ? parseInt(parentId, 10) : null,
    });

    // Send Notification to Post Author or Parent Comment Author
    try {
      const targetPost = await Post.findByPk(id);
      if (targetPost && targetPost.userId && targetPost.userId !== userId) {
        await notificationService.createNotification({
          userId: targetPost.userId,
          type: 'comment',
          message: `New comment on your article "${targetPost.title}"`,
          link: `/post/${id}`,
        });
      }

      if (parentId) {
        const parentComment = await CommentModel.findByPk(parentId);
        if (parentComment && parentComment.userId && parentComment.userId !== userId) {
          await notificationService.createNotification({
            userId: parentComment.userId,
            type: 'reply',
            message: `New reply to your comment on "${targetPost ? targetPost.title : 'an article'}"`,
            link: `/post/${id}`,
          });
        }
      }
    } catch (notifErr) {
      logger.warn({ err: notifErr.message }, 'Failed to create notification for comment');
    }

    logger.info({ postId: id, userId, parentId }, 'New comment submitted for moderation');
    return res.redirect(`/post/${id}?commentAdded=1`);
  });

  searchPosts = catchAsync(async (req, res) => {
    const searchTerm = req.query.q || req.query.searchTerm || req.body.searchTerm || '';

    const locals = {
      title: searchTerm ? `Search: "${searchTerm}"` : 'Search Articles',
      description: 'Search articles, tutorials and guides on DevHub.',
    };

    const data = searchTerm.trim() ? await postService.searchPosts(searchTerm) : [];

    res.render('search', {
      data,
      searchTerm,
      locals,
      currentRoute: '/search',
    });
  });

  apiSearchPosts = catchAsync(async (req, res) => {
    const searchTerm = req.query.q || req.query.searchTerm || '';
    if (!searchTerm.trim()) {
      return res.json({ results: [], query: '', total: 0 });
    }

    const posts = await postService.searchPosts(searchTerm);
    const results = posts.map(post => ({
      id: post._id,
      title: post.title,
      snippet: post.body ? post.body.replace(/[#*`_]/g, '').substring(0, 110) + '...' : '',
      category: post.category ? post.category.name : null,
      readTime: post.readingTime || '3 min read',
      date: post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    }));

    return res.json({ results, query: searchTerm, total: results.length });
  });

  apiGetPosts = catchAsync(async (req, res) => {
    const categorySlug = req.query.category || null;
    const page = req.query.page || 1;
    const { data, current, nextPage, count } = await postService.getPaginatedPosts(page, 10, categorySlug);

    return res.json({
      posts: data,
      current,
      nextPage,
      totalCount: count,
      activeCategory: categorySlug,
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

  getRssFeed = catchAsync(async (req, res) => {
    const { data: posts } = await postService.getPaginatedPosts(1, 30);
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    xml += `<channel>\n`;
    xml += `  <title>DevHub — Backend Architecture &amp; Tech Articles</title>\n`;
    xml += `  <link>${baseUrl}</link>\n`;
    xml += `  <description>Technical articles, guides, and practical tutorials for backend developers.</description>\n`;
    xml += `  <language>en</language>\n`;
    xml += `  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />\n`;

    posts.forEach(post => {
      xml += `  <item>\n`;
      xml += `    <title><![CDATA[${post.title}]]></title>\n`;
      xml += `    <link>${baseUrl}/post/${post._id}</link>\n`;
      xml += `    <guid isPermaLink="true">${baseUrl}/post/${post._id}</guid>\n`;
      xml += `    <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>\n`;
      if (post.category) {
        xml += `    <category><![CDATA[${post.category.name}]]></category>\n`;
      }
      xml += `    <description><![CDATA[${post.excerpt || post.body}]]></description>\n`;
      xml += `  </item>\n`;
    });

    xml += `</channel>\n`;
    xml += `</rss>`;

    res.set('Content-Type', 'text/xml');
    return res.send(xml);
  });

  exportPostMarkdown = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    const filename = `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const markdownContent = `# ${post.title}\n\n*Author: ${post.author ? (post.author.displayName || post.author.username) : 'DevHub'}*\n*Date: ${post.createdAtFormatted}*\n*Category: ${post.category ? post.category.name : 'General'}*\n\n---\n\n${post.body}\n`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(markdownContent);
  });
}

module.exports = new MainController();

