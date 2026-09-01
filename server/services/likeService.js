const { PostLike, Post, Category, Tag, User } = require('../models');
const PostDto = require('../dtos/postDto');

class LikeService {
  /**
   * Toggles like status for a given user and post.
   * @param {number} userId - ID of the authenticated user.
   * @param {number} postId - ID of the article.
   * @returns {Promise<{ liked: boolean, likesCount: number }>}
   */
  async toggleLike(userId, postId) {
    const pId = parseInt(postId, 10);
    const existing = await PostLike.findOne({
      where: { userId, postId: pId },
    });

    let liked = false;
    if (existing) {
      await existing.destroy();
      liked = false;
    } else {
      await PostLike.create({
        userId,
        postId: pId,
      });
      liked = true;
    }

    const likesCount = await this.getLikesCount(pId);
    return { liked, likesCount };
  }

  /**
   * Retrieves total likes count for a post.
   * @param {number} postId
   * @returns {Promise<number>}
   */
  async getLikesCount(postId) {
    if (!postId) return 0;
    return await PostLike.count({
      where: { postId: parseInt(postId, 10) },
    });
  }

  /**
   * Checks if a post is liked by a user.
   * @param {number} userId
   * @param {number} postId
   * @returns {Promise<boolean>}
   */
  async isLiked(userId, postId) {
    if (!userId || !postId) return false;
    const count = await PostLike.count({
      where: { userId, postId: parseInt(postId, 10) },
    });
    return count > 0;
  }

  /**
   * Retrieves all posts liked by a user.
   * @param {number} userId
   * @returns {Promise<PostDto[]>}
   */
  async getUserLikedPosts(userId) {
    const likeRows = await PostLike.findAll({
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

    const posts = likeRows.map((l) => l.post).filter(Boolean);
    return PostDto.formatMany(posts);
  }
}

module.exports = new LikeService();
