const { Op } = require('sequelize');
const { Post, Category, Comment, Tag, User, PostLike, Series } = require('../models');
const PostDto = require('../dtos/postDto');
const { PAGINATION_LIMIT } = require('../config/constants');

class PostService {
  async getPaginatedPosts(page = 1, limit = PAGINATION_LIMIT, categorySlug = null) {
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limit;

    const whereClause = { status: 'published' };
    const includeClause = [
      { model: Category, as: 'category' },
      { model: Tag, as: 'tags', through: { attributes: [] } },
      { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
      { model: PostLike, as: 'likes', attributes: ['id', 'userId'] },
      { model: Series, as: 'series' },
    ];

    if (categorySlug) {
      const category = await Category.findOne({ where: { slug: categorySlug } });
      if (category) {
        whereClause.categoryId = category.id;
      }
    }

    const { count, rows } = await Post.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      distinct: true,
      limit,
      offset,
    });

    const nextPage = pageNum + 1;
    const hasNextPage = nextPage <= Math.ceil(count / limit);

    return {
      data: PostDto.formatMany(rows),
      count,
      current: pageNum,
      nextPage: hasNextPage ? nextPage : null,
    };
  }

  async getPostById(id, incrementViews = false) {
    const post = await Post.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
        { model: PostLike, as: 'likes', attributes: ['id', 'userId'] },
        {
          model: Series,
          as: 'series',
          include: [
            {
              model: Post,
              as: 'posts',
              attributes: ['id', 'title', 'seriesOrder', 'status'],
              where: { status: 'published' },
              required: false,
            },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          where: { isApproved: true, parentId: null },
          required: false,
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] },
            {
              model: Comment,
              as: 'replies',
              where: { isApproved: true },
              required: false,
              include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
            },
          ],
        },
      ],
    });

    if (!post) {
      return null;
    }

    if (incrementViews) {
      await post.increment('viewsCount', { by: 1 });
      post.viewsCount += 1;
    }

    return PostDto.formatOne(post);
  }

  async searchPosts(searchTerm = '') {
    const trimmed = searchTerm ? searchTerm.trim() : '';
    if (!trimmed) return [];

    // Escape SQL LIKE wildcards % and _ so they are matched literally
    const escaped = trimmed.replace(/[%_]/g, '\\$&');

    const posts = await Post.findAll({
      where: {
        status: 'published',
        [Op.or]: [
          { title: { [Op.like]: `%${escaped}%` } },
          { body: { [Op.like]: `%${escaped}%` } },
        ],
      },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return PostDto.formatMany(posts);
  }

  async getAllPosts() {
    const posts = await Post.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return PostDto.formatMany(posts);
  }

  async getUserPosts(userId) {
    const posts = await Post.findAll({
      where: { userId },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
    });
    return PostDto.formatMany(posts);
  }

  async getUserPostById(id, userId) {
    const post = await Post.findOne({
      where: { id, userId },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });
    return PostDto.formatOne(post);
  }

  async getPendingPosts() {
    const posts = await Post.findAll({
      where: { status: 'pending' },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['createdAt', 'ASC']],
    });
    return PostDto.formatMany(posts);
  }

  async getPendingCount() {
    return await Post.count({ where: { status: 'pending' } });
  }

  async approvePost(id) {
    const post = await Post.findByPk(id);
    if (!post) return false;
    await post.update({ status: 'published' });
    return true;
  }

  async rejectPost(id) {
    const post = await Post.findByPk(id);
    if (!post) return false;
    await post.update({ status: 'rejected' });
    return true;
  }

  async createPost({ title, body, categoryId = null, featuredImage = null, userId = null, tags = [], status = 'published', difficultyLevel = 'Intermediate' }) {
    const newPost = await Post.create({
      title,
      body,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      featuredImage,
      userId,
      status,
      difficultyLevel,
    });

    if (tags.length > 0) {
      await newPost.setTags(tags);
    }

    return newPost;
  }

  async updatePost(id, { title, body, categoryId = null, featuredImage = null, tags = null, status = null, difficultyLevel = null }) {
    const post = await Post.findByPk(id);
    if (!post) {
      return null;
    }

    const updateData = {
      title,
      body,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
    };

    if (featuredImage) {
      updateData.featuredImage = featuredImage;
    }

    if (status) {
      updateData.status = status;
    }

    if (difficultyLevel) {
      updateData.difficultyLevel = difficultyLevel;
    }

    await post.update(updateData);

    if (tags !== null) {
      await post.setTags(tags);
    }

    return post;
  }

  async deletePost(id, userId = null) {
    const whereClause = { id };
    if (userId) {
      whereClause.userId = userId;
    }

    const post = await Post.findOne({ where: whereClause });
    if (!post) {
      return false;
    }

    await post.destroy();
    return true;
  }

  async getPopularPosts(limit = 3) {
    const rows = await Post.findAll({
      where: { status: 'published' },
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
      ],
      order: [['viewsCount', 'DESC']],
      limit,
    });
    return PostDto.formatMany(rows);
  }

  async getTopAuthors(limit = 4) {
    const authors = await User.findAll({
      attributes: ['id', 'username', 'displayName', 'avatarUrl', 'bio'],
      include: [
        {
          model: Post,
          as: 'posts',
          where: { status: 'published' },
          attributes: ['id'],
        },
      ],
    });
    return authors
      .map(author => ({
        ...author.toJSON(),
        articlesCount: author.posts ? author.posts.length : 0,
      }))
      .filter(author => author.articlesCount > 0)
      .sort((a, b) => b.articlesCount - a.articlesCount)
      .slice(0, limit);
  }

  async getTotalCount() {
    return await Post.count({ where: { status: 'published' } });
  }

  async getTotalViews() {
    return await Post.sum('viewsCount') || 0;
  }
}

module.exports = new PostService();
