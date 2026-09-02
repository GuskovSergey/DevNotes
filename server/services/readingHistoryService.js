const { ReadingHistory, Post, Category, User, Tag } = require('../models');
const PostDto = require('../dtos/postDto');

class ReadingHistoryService {
  /**
   * Records or updates a post visit for a logged-in user.
   * @param {number} userId
   * @param {number} postId
   */
  async recordVisit(userId, postId) {
    if (!userId || !postId) return;
    const pId = parseInt(postId, 10);
    
    const existing = await ReadingHistory.findOne({
      where: { userId, postId: pId },
    });

    if (existing) {
      await existing.update({ readAt: new Date() });
    } else {
      await ReadingHistory.create({
        userId,
        postId: pId,
        readAt: new Date(),
      });
    }
  }

  /**
   * Retrieves reading history for a user.
   * @param {number} userId
   * @returns {Promise<Array<{ post: PostDto, readAt: Date, readAtFormatted: string }>>}
   */
  async getUserHistory(userId) {
    const historyRows = await ReadingHistory.findAll({
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
      order: [['readAt', 'DESC']],
    });

    return historyRows.map(row => ({
      post: PostDto.formatOne(row.post),
      readAt: row.readAt,
      readAtFormatted: new Date(row.readAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })).filter(h => h.post !== null);
  }

  /**
   * Clears all reading history for a user.
   * @param {number} userId
   */
  async clearUserHistory(userId) {
    if (!userId) return;
    await ReadingHistory.destroy({
      where: { userId },
    });
  }
}

module.exports = new ReadingHistoryService();
