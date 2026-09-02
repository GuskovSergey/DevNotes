const { marked } = require('marked');

class CourseDto {
  constructor(course, userProgressLessonIds = []) {
    this.id = course.id;
    this._id = course.id; // Legacy view compatibility
    this.title = course.title;
    this.slug = course.slug;
    this.description = course.description || '';
    this.body = course.body || '';
    this.bodyHtml = course.body ? marked.parse(course.body) : '';
    this.status = course.status || 'published';
    this.difficultyLevel = course.difficultyLevel || 'Intermediate';

    const cleanDesc = course.description ? course.description.replace(/[#*`_~>[\]()!|-]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    this.descriptionSnippet = cleanDesc.length > 180 ? cleanDesc.substring(0, 180) + '...' : cleanDesc;

    this.coverImage = course.coverImage ? (course.coverImage.startsWith('/uploads/') ? course.coverImage : `/uploads/${course.coverImage}`) : null;
    this.estimatedHours = course.estimatedHours || 1.0;
    this.estimatedTime = `~${course.estimatedHours || 1} hours`;

    this.category = course.category ? {
      id: course.category.id,
      name: course.category.name,
      slug: course.category.slug,
    } : null;

    this.author = course.author ? {
      id: course.author.id,
      username: course.author.username,
      displayName: course.author.displayName || course.author.username,
      avatarUrl: course.author.avatarUrl ? (course.author.avatarUrl.startsWith('/uploads/') ? course.author.avatarUrl : `/uploads/${course.author.avatarUrl}`) : null,
    } : null;

    const lessonsList = course.lessons ? [...course.lessons].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    this.lessonsCount = lessonsList.length;

    let completedCount = 0;
    this.lessons = lessonsList.map(l => {
      const isCompleted = userProgressLessonIds.includes(l.id);
      if (isCompleted) completedCount++;

      const wordCount = l.body ? l.body.trim().split(/\s+/).length : 0;
      const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

      return {
        id: l.id,
        courseId: l.courseId,
        title: l.title,
        slug: l.slug,
        order: l.order,
        readingTime: `${readingMinutes} min read`,
        isCompleted,
      };
    });

    this.completedLessonsCount = completedCount;
    this.progressPercent = this.lessonsCount > 0 ? Math.round((completedCount / this.lessonsCount) * 100) : 0;
    this.createdAtFormatted = new Date(course.createdAt).toDateString();
    this.createdAt = new Date(course.createdAt);
  }

  static formatMany(courses, progressMap = {}) {
    return courses.map(c => new CourseDto(c, progressMap[c.id] || []));
  }

  static formatOne(course, userProgressLessonIds = []) {
    return course ? new CourseDto(course, userProgressLessonIds) : null;
  }
}

module.exports = CourseDto;
