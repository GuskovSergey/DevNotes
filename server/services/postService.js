const { Op } = require('sequelize');
const { Post, Category, Comment, Tag, User } = require('../models');
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
        {
          model: Comment,
          as: 'comments',
          where: { isApproved: true },
          required: false,
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
    const sanitizedSearch = searchTerm.replace(/[^a-zA-Z0-9а-яА-ЯёЁ ]/g, '');

    const posts = await Post.findAll({
      where: {
        status: 'published',
        [Op.or]: [
          { title: { [Op.like]: `%${sanitizedSearch}%` } },
          { body: { [Op.like]: `%${sanitizedSearch}%` } },
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

  async createPost({ title, body, categoryId = null, featuredImage = null, userId = null, tags = [], status = 'published' }) {
    const newPost = await Post.create({
      title,
      body,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      featuredImage,
      userId,
      status,
    });

    if (tags.length > 0) {
      await newPost.setTags(tags);
    }

    return newPost;
  }

  async updatePost(id, { title, body, categoryId = null, featuredImage = null, tags = null, status = null }) {
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

  async getTotalCount() {
    return await Post.count({ where: { status: 'published' } });
  }

  async getTotalViews() {
    return await Post.sum('viewsCount') || 0;
  }
}

module.exports = new PostService();
