const { Bookmark, Post, Category, Tag, User } = require('../models');
const PostDto = require('../dtos/postDto');

class BookmarkService {
  /**
   * Toggles bookmark status for a given user and post.
   * @param {number} userId - ID of the authenticated user.
   * @param {number} postId - ID of the article.
   * @returns {Promise<{ bookmarked: boolean }>}
   */
  async toggleBookmark(userId, postId) {
    const pId = parseInt(postId, 10);
    const existing = await Bookmark.findOne({
      where: { userId, postId: pId },
    });

    if (existing) {
      await existing.destroy();
      return { bookmarked: false };
    } else {
      await Bookmark.create({
        userId,
        postId: pId,
      });
      return { bookmarked: true };
    }
  }

  /**
   * Checks if a post is bookmarked by a user.
   * @param {number} userId
   * @param {number} postId
   * @returns {Promise<boolean>}
   */
  async isBookmarked(userId, postId) {
    if (!userId || !postId) return false;
    const count = await Bookmark.count({
      where: { userId, postId: parseInt(postId, 10) },
    });
    return count > 0;
  }

  /**
   * Retrieves all bookmarked posts for a user.
   * @param {number} userId
   * @returns {Promise<PostDto[]>}
   */
  async getUserBookmarks(userId) {
    const bookmarkRows = await Bookmark.findAll({
      where: { userId },
      include: [
        {
          model: Post,
          as: 'post',
          where: { status: 'published' },
          include: [
            { model: Category, as: 'category' },
            { model: Tag, as: 'tags', through: { attributes: [] } },
            { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const posts = bookmarkRows.map((b) => b.post).filter(Boolean);
    return PostDto.formatMany(posts);
  }

  /**
   * Retrieves an array of post IDs bookmarked by a user.
   * @param {number} userId
   * @returns {Promise<number[]>}
   */
  async getBookmarkedPostIds(userId) {
    if (!userId) return [];
    const rows = await Bookmark.findAll({
      where: { userId },
      attributes: ['postId'],
    });
    return rows.map((r) => r.postId);
  }
}

module.exports = new BookmarkService();
