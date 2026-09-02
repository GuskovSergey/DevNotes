const { marked } = require('marked');

class LessonDto {
  constructor(lesson, course = null, isCompleted = false) {
    this.id = lesson.id;
    this.courseId = lesson.courseId;
    this.title = lesson.title;
    this.slug = lesson.slug;
    this.body = lesson.body;
    this.bodyHtml = lesson.body ? marked.parse(lesson.body) : '';
    this.order = lesson.order || 1;
    this.status = lesson.status || 'published';
    this.isCompleted = isCompleted;

    const wordCount = lesson.body ? lesson.body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    this.readingTime = `${minutes} min read`;

    if (course && course.lessons) {
      const sortedLessons = [...course.lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id);

      this.prevLesson = currentIndex > 0 ? {
        title: sortedLessons[currentIndex - 1].title,
        slug: sortedLessons[currentIndex - 1].slug,
      } : null;

      this.nextLesson = currentIndex >= 0 && currentIndex < sortedLessons.length - 1 ? {
        title: sortedLessons[currentIndex + 1].title,
        slug: sortedLessons[currentIndex + 1].slug,
      } : null;

      this.course = {
        id: course.id,
        title: course.title,
        slug: course.slug,
        totalLessons: sortedLessons.length,
        currentOrder: lesson.order,
        lessons: sortedLessons.map(l => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          order: l.order,
        })),
      };
    } else {
      this.prevLesson = null;
      this.nextLesson = null;
      this.course = null;
    }

    const formatComment = (c) => ({
      id: c.id,
      parentId: c.parentId || null,
      userId: c.userId || null,
      authorName: c.user ? (c.user.displayName || c.user.username) : c.authorName,
      user: c.user ? {
        id: c.user.id,
        username: c.user.username,
        displayName: c.user.displayName || c.user.username,
        avatarUrl: c.user.avatarUrl ? (c.user.avatarUrl.startsWith('/uploads/') ? c.user.avatarUrl : `/uploads/${c.user.avatarUrl}`) : null,
      } : null,
      content: c.content,
      contentHtml: c.content ? marked.parse(c.content) : '',
      createdAtFormatted: new Date(c.createdAt).toDateString(),
      replies: c.replies ? c.replies.map(formatComment) : [],
    });

    this.comments = lesson.comments ? lesson.comments.map(formatComment) : [];
  }

  static formatOne(lesson, course = null, isCompleted = false) {
    return lesson ? new LessonDto(lesson, course, isCompleted) : null;
  }
}

module.exports = LessonDto;
