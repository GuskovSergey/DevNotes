const { Post, PostLike, Bookmark, Comment, Category } = require('../models');
const PostDto = require('../dtos/postDto');

class AnalyticsService {
  /**
   * Retrieves aggregated author performance metrics & top posts.
   * @param {number} userId
   */
  async getAuthorAnalytics(userId) {
    if (!userId) {
      return {
        totalArticles: 0,
        totalViews: 0,
        totalLikes: 0,
        totalBookmarks: 0,
        totalComments: 0,
        topPosts: [],
      };
    }

    const posts = await Post.findAll({
      where: { userId, status: 'published' },
      include: [
        { model: Category, as: 'category' },
        { model: PostLike, as: 'likes' },
        { model: Bookmark, as: 'bookmarks' },
        { model: Comment, as: 'comments' },
      ],
    });

    const totalArticles = posts.length;
    const totalViews = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0);
    const totalBookmarks = posts.reduce((sum, p) => sum + (p.bookmarks ? p.bookmarks.length : 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments ? p.comments.length : 0), 0);

    const sortedPosts = [...posts].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    const topPosts = PostDto.formatMany(sortedPosts.slice(0, 3));

    return {
      totalArticles,
      totalViews,
      totalLikes,
      totalBookmarks,
      totalComments,
      topPosts,
    };
  }
}

module.exports = new AnalyticsService();
