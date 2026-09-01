const { Comment, Post } = require('../models');

class CommentService {
  async addComment({ postId, authorName, authorEmail, content, userId = null, parentId = null }) {
    return await Comment.create({
      postId,
      authorName,
      authorEmail,
      content,
      userId,
      parentId: parentId ? parseInt(parentId, 10) : null,
      isApproved: false, // Moderation by default
    });
  }

  async getApprovedCommentsForPost(postId) {
    return await Comment.findAll({
      where: {
        postId,
        isApproved: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async getPendingComments() {
    return await Comment.findAll({
      where: { isApproved: false },
      include: [{ model: Post, as: 'post', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getAllComments() {
    return await Comment.findAll({
      include: [{ model: Post, as: 'post', attributes: ['id', 'title'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async approveComment(id) {
    const comment = await Comment.findByPk(id);
    if (!comment) return false;
    await comment.update({ isApproved: true });
    return true;
  }

  async deleteComment(id) {
    const comment = await Comment.findByPk(id);
    if (!comment) return false;
    await comment.destroy();
    return true;
  }

  async getPendingCount() {
    return await Comment.count({ where: { isApproved: false } });
  }

  async getTotalCount() {
    return await Comment.count();
  }
}

module.exports = new CommentService();
