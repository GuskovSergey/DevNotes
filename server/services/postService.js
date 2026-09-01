const { Op } = require('sequelize');
const { Post, Category, Comment } = require('../models');
const PostDto = require('../dtos/postDto');
const { PAGINATION_LIMIT } = require('../config/constants');

class PostService {
  async getPaginatedPosts(page = 1, limit = PAGINATION_LIMIT, categorySlug = null) {
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limit;

    const whereClause = {};
    const includeClause = [{ model: Category, as: 'category' }];

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
        [Op.or]: [
          { title: { [Op.like]: `%${sanitizedSearch}%` } },
          { body: { [Op.like]: `%${sanitizedSearch}%` } },
        ],
      },
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']],
    });

    return PostDto.formatMany(posts);
  }

  async getAllPosts() {
    const posts = await Post.findAll({
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']],
    });
    return PostDto.formatMany(posts);
  }

  async createPost({ title, body, categoryId = null, featuredImage = null, userId = null }) {
    const newPost = await Post.create({
      title,
      body,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      featuredImage,
      userId,
    });
    return PostDto.formatOne(newPost);
  }

  async updatePost(id, { title, body, categoryId = null, featuredImage = null }) {
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

    await post.update(updateData);
    return PostDto.formatOne(post);
  }

  async deletePost(id) {
    const post = await Post.findByPk(id);
    if (!post) {
      return false;
    }

    await post.destroy();
    return true;
  }

  async getTotalCount() {
    return await Post.count();
  }

  async getTotalViews() {
    return await Post.sum('viewsCount') || 0;
  }
}

module.exports = new PostService();
