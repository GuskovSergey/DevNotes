const { Tag, Post, Category, PostTag } = require('../models');
const { Op } = require('sequelize');
const PostDto = require('../dtos/postDto');
const { PAGINATION_LIMIT } = require('../config/constants');

/**
 * Generates a URL-friendly slug from a tag name.
 * Converts to lowercase, replaces spaces/special chars with hyphens.
 * @param {string} name - The tag name to slugify.
 * @returns {string} The generated slug.
 */
const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

class TagService {
  /**
   * Retrieves all tags ordered alphabetically.
   * @returns {Promise<Tag[]>}
   */
  async getAllTags() {
    return await Tag.findAll({
      order: [['name', 'ASC']],
    });
  }

  async getAllTagsWithCounts() {
    const tags = await Tag.findAll({
      order: [['name', 'ASC']],
    });

    const tagsWithCounts = await Promise.all(
      tags.map(async (tag) => {
        const postsCount = await PostTag.count({
          where: { tagId: tag.id },
        });
        return {
          ...tag.toJSON(),
          postsCount,
        };
      })
    );

    return tagsWithCounts;
  }

  async createTag({ name, slug }) {
    const generatedSlug = slug ? slugify(slug) : slugify(name);
    return await Tag.create({
      name,
      slug: generatedSlug,
    });
  }

  async updateTag(id, { name, slug }) {
    const tag = await Tag.findByPk(id);
    if (!tag) {
      const error = new Error('Tag not found');
      error.statusCode = 404;
      throw error;
    }

    if (name) tag.name = name;
    if (slug) tag.slug = slugify(slug);

    await tag.save();
    return tag;
  }

  async deleteTag(id) {
    const tag = await Tag.findByPk(id);
    if (!tag) {
      const error = new Error('Tag not found');
      error.statusCode = 404;
      throw error;
    }

    await PostTag.destroy({ where: { tagId: id } });
    await tag.destroy();
    return true;
  }

  /**
   * Finds existing tags or creates new ones from a comma-separated string.
   * Deduplicates and normalizes tag names before processing.
   * @param {string} tagsString - Comma-separated tag names (e.g. "node, express, sqlite").
   * @returns {Promise<Tag[]>} Array of found or newly created Tag instances.
   */
  async findOrCreateTags(tagsString) {
    if (!tagsString || !tagsString.trim()) {
      return [];
    }

    const tagNames = [...new Set(
      tagsString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    )];

    const tags = [];
    for (const name of tagNames) {
      const slug = slugify(name);
      if (!slug) continue;

      const [tag] = await Tag.findOrCreate({
        where: { slug },
        defaults: { name, slug },
      });
      tags.push(tag);
    }

    return tags;
  }

  /**
   * Associates an array of tags with a post.
   * Replaces all existing tag associations for that post.
   * @param {Post} post - The Sequelize Post instance.
   * @param {Tag[]} tags - Array of Tag instances to associate.
   */
  async setPostTags(post, tags) {
    await post.setTags(tags);
  }

  /**
   * Retrieves paginated posts filtered by a given tag slug.
   * Uses a two-step query to avoid duplicate eager-loading conflicts.
   * @param {string} tagSlug - The tag slug to filter by.
   * @param {number} page - Current page number (1-indexed).
   * @param {number} limit - Posts per page.
   * @returns {Promise<{tag: Tag|null, data: PostDto[], current: number, nextPage: number|null}>}
   */
  async getPostsByTag(tagSlug, page = 1, limit = PAGINATION_LIMIT) {
    const tag = await Tag.findOne({ where: { slug: tagSlug } });
    if (!tag) {
      return { tag: null, data: [], current: 1, nextPage: null };
    }

    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limit;

    // Step 1: Get post IDs associated with this tag
    const postTagRows = await PostTag.findAll({
      where: { tagId: tag.id },
      attributes: ['postId'],
    });
    const postIds = postTagRows.map((pt) => pt.postId);

    if (postIds.length === 0) {
      return { tag, data: [], current: 1, nextPage: null };
    }

    // Step 2: Fetch posts with full eager loading
    const { count, rows } = await Post.findAndCountAll({
      where: { id: { [Op.in]: postIds } },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const nextPage = pageNum + 1;
    const hasNextPage = nextPage <= Math.ceil(count / limit);

    return {
      tag,
      data: PostDto.formatMany(rows),
      current: pageNum,
      nextPage: hasNextPage ? nextPage : null,
    };
  }
}

module.exports = new TagService();
