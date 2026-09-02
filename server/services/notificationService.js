const { Notification } = require('../models');

class NotificationService {
  /**
   * Creates a notification for a specified user.
   * @param {object} params
   * @param {number} params.userId
   * @param {string} params.type - 'comment' | 'reply' | 'moderation_approved' | 'moderation_rejected' | 'system'
   * @param {string} params.message
   * @param {string} [params.link]
   */
  async createNotification({ userId, type = 'system', message, link = null }) {
    if (!userId || !message) return null;
    return await Notification.create({
      userId,
      type,
      message,
      link,
      isRead: false,
    });
  }

  /**
   * Retrieves all notifications for a user ordered by newest first.
   * @param {number} userId
   */
  async getUserNotifications(userId) {
    if (!userId) return [];
    const rows = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return rows.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      link: n.link || '#',
      isRead: n.isRead,
      createdAt: n.createdAt,
      createdAtFormatted: new Date(n.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }

  /**
   * Gets total number of unread notifications for a user.
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;
    return await Notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marks a specific notification as read.
   * @param {number} id
   * @param {number} userId
   */
  async markAsRead(id, userId) {
    const notification = await Notification.findOne({
      where: { id: parseInt(id, 10), userId },
    });
    if (notification) {
      await notification.update({ isRead: true });
    }
  }

  /**
   * Marks all notifications for a user as read.
   * @param {number} userId
   */
  async markAllAsRead(userId) {
    if (!userId) return;
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
  }
}

module.exports = new NotificationService();
