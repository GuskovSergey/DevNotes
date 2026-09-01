class PostDto {
  constructor(post) {
    this.id = post.id;
    this._id = post.id; // Legacy view compatibility
    this.title = post.title;
    this.body = post.body;
    
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
    this.featuredImage = post.featuredImage ? `/uploads/${post.featuredImage}` : null;
    this.viewsCount = post.viewsCount || 0;
    this.createdAtFormatted = new Date(post.createdAt).toDateString();
    this.createdAt = new Date(post.createdAt);
    this.updatedAt = new Date(post.updatedAt);
    this.comments = post.comments ? post.comments.map(c => ({
      id: c.id,
      authorName: c.authorName,
      content: c.content,
      createdAtFormatted: new Date(c.createdAt).toDateString(),
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
