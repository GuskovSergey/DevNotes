const { marked } = require('marked');

class PostDto {
  constructor(post) {
    this.id = post.id;
    this._id = post.id; // Legacy view compatibility
    this.title = post.title;
    this.body = post.body;
    this.bodyHtml = post.body ? marked.parse(post.body) : '';
    this.status = post.status || 'published';
    
    // Clean text snippet for excerpts (strips markdown syntax & caps length)
    const cleanText = post.body ? post.body.replace(/[#*`_~>[\]()!|-]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    this.bodySnippet = cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;

    // Reading time calculation (~180 words per min)
    const wordCount = post.body ? post.body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    this.readingTime = `${minutes} min read`;

    this.categoryId = post.categoryId || null;
    this.category = post.category ? {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
    } : null;

    this.author = post.author ? {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName || post.author.username,
    } : null;

    this.featuredImage = post.featuredImage ? `/uploads/${post.featuredImage}` : null;
    this.viewsCount = post.viewsCount || 0;
    this.likesCount = post.likes ? post.likes.length : 0;
    this.createdAtFormatted = new Date(post.createdAt).toDateString();
    this.createdAt = new Date(post.createdAt);
    this.updatedAt = new Date(post.updatedAt);
    this.difficultyLevel = post.difficultyLevel || 'Intermediate';

    this.series = post.series ? (() => {
      const sortedPosts = (post.series.posts || []).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
      const currentIndex = sortedPosts.findIndex(p => p.id === post.id);
      return {
        id: post.series.id,
        name: post.series.name,
        slug: post.series.slug,
        description: post.series.description,
        totalChapters: sortedPosts.length,
        currentOrder: post.seriesOrder || (currentIndex + 1),
        posts: sortedPosts.map(p => ({
          id: p.id,
          title: p.title,
          seriesOrder: p.seriesOrder,
          isCurrent: p.id === post.id,
        })),
        prevPost: currentIndex > 0 ? sortedPosts[currentIndex - 1] : null,
        nextPost: currentIndex >= 0 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null,
      };
    })() : null;

    const formatComment = (c) => ({
      id: c.id,
      parentId: c.parentId || null,
      userId: c.userId || null,
      authorName: c.user ? (c.user.displayName || c.user.username) : c.authorName,
      user: c.user ? {
        id: c.user.id,
        username: c.user.username,
        displayName: c.user.displayName || c.user.username,
      } : null,
      content: c.content,
      contentHtml: c.content ? marked.parse(c.content) : '',
      createdAtFormatted: new Date(c.createdAt).toDateString(),
      replies: c.replies ? c.replies.map(formatComment) : [],
    });

    this.comments = post.comments ? post.comments.map(formatComment) : [];
    this.tags = post.tags ? post.tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
    })) : [];
  }

  static formatMany(posts) {
    return posts.map(post => new PostDto(post));
  }

  static formatOne(post) {
    return post ? new PostDto(post) : null;
  }
}

module.exports = PostDto;
