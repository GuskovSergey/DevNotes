const { Course, Lesson, CourseProgress, Category, User, Comment } = require('../models');
const CourseDto = require('../dtos/courseDto');
const LessonDto = require('../dtos/lessonDto');
const logger = require('../config/logger');

class CourseService {
  /**
   * Retrieves all published courses.
   * @param {number} [userId] - Optional current user ID for progress mapping
   */
  async getAllPublishedCourses(userId = null) {
    const courses = await Course.findAll({
      where: { status: 'published' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
        { model: Lesson, as: 'lessons', where: { status: 'published' }, required: false, attributes: ['id', 'title', 'slug', 'order', 'body'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const progressMap = {};
    if (userId && courses.length > 0) {
      const courseIds = courses.map(c => c.id);
      const progressRecords = await CourseProgress.findAll({
        where: { userId, courseId: courseIds },
      });

      progressRecords.forEach(rec => {
        if (!progressMap[rec.courseId]) {
          progressMap[rec.courseId] = [];
        }
        progressMap[rec.courseId].push(rec.lessonId);
      });
    }

    return CourseDto.formatMany(courses, progressMap);
  }

  /**
   * Retrieves a course by its slug.
   * @param {string} slug 
   * @param {number} [userId]
   */
  async getCourseBySlug(slug, userId = null) {
    const course = await Course.findOne({
      where: { slug, status: 'published' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
        { model: Lesson, as: 'lessons', where: { status: 'published' }, required: false, attributes: ['id', 'title', 'slug', 'order', 'body'] },
      ],
    });

    if (!course) return null;

    let userProgressLessonIds = [];
    if (userId) {
      const progressRecords = await CourseProgress.findAll({
        where: { userId, courseId: course.id },
      });
      userProgressLessonIds = progressRecords.map(r => r.lessonId);
    }

    return CourseDto.formatOne(course, userProgressLessonIds);
  }

  /**
   * Retrieves a lesson by course slug and lesson slug.
   * @param {string} courseSlug 
   * @param {string} lessonSlug 
   * @param {number} [userId]
   */
  async getLessonBySlug(courseSlug, lessonSlug, userId = null) {
    const course = await Course.findOne({
      where: { slug: courseSlug, status: 'published' },
      include: [
        { model: Lesson, as: 'lessons', where: { status: 'published' }, required: false },
      ],
    });

    if (!course) return null;

    const lesson = await Lesson.findOne({
      where: { courseId: course.id, slug: lessonSlug, status: 'published' },
      include: [
        {
          model: Comment,
          as: 'comments',
          where: { isApproved: true, parentId: null },
          required: false,
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
            {
              model: Comment,
              as: 'replies',
              where: { isApproved: true },
              required: false,
              include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatarUrl'] }],
            },
          ],
        },
      ],
    });

    if (!lesson) return null;

    let isCompleted = false;
    if (userId) {
      const record = await CourseProgress.findOne({
        where: { userId, courseId: course.id, lessonId: lesson.id },
      });
      isCompleted = !!record;
    }

    return LessonDto.formatOne(lesson, course, isCompleted);
  }

  /**
   * Toggles completion status of a lesson for a user.
   * @param {number} userId 
   * @param {number} courseId 
   * @param {number} lessonId 
   */
  async toggleLessonProgress(userId, courseId, lessonId) {
    if (!userId || !courseId || !lessonId) return { completed: false };

    const existing = await CourseProgress.findOne({
      where: { userId, courseId, lessonId },
    });

    if (existing) {
      await existing.destroy();
      logger.info({ userId, courseId, lessonId }, 'Lesson marked as uncompleted');
      return { completed: false };
    } else {
      await CourseProgress.create({ userId, courseId, lessonId });
      logger.info({ userId, courseId, lessonId }, 'Lesson marked as completed');
      return { completed: true };
    }
  }

  /**
   * Helper to create a URL slug from a title string.
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * User cabinet course management methods
   */
  async getUserCourses(userId) {
    const courses = await Course.findAll({
      where: { userId },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Lesson, as: 'lessons', attributes: ['id', 'title', 'order', 'status'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return CourseDto.formatMany(courses);
  }

  async getUserCourseById(id, userId) {
    const course = await Course.findOne({
      where: { id, userId },
      include: [
        { model: Category, as: 'category' },
        { model: Lesson, as: 'lessons' },
      ],
    });
    return CourseDto.formatOne(course);
  }

  async getUserLessonById(id, userId) {
    const lesson = await Lesson.findByPk(id, {
      include: [{ model: Course, as: 'course' }],
    });
    if (!lesson || lesson.course.userId !== userId) return null;
    return lesson;
  }

  /**
   * Admin moderation methods
   */
  async getPendingCourses() {
    const courses = await Course.findAll({
      where: { status: 'pending' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName', 'avatarUrl'] },
        { model: Lesson, as: 'lessons', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'ASC']],
    });
    return CourseDto.formatMany(courses);
  }

  async getPendingCoursesCount() {
    return await Course.count({ where: { status: 'pending' } });
  }

  async approveCourse(id) {
    const course = await Course.findByPk(id, {
      include: [{ model: User, as: 'author' }],
    });
    if (!course) return null;
    await course.update({ status: 'published' });
    logger.info({ courseId: id }, 'Course approved and published');
    return course;
  }

  async rejectCourse(id) {
    const course = await Course.findByPk(id, {
      include: [{ model: User, as: 'author' }],
    });
    if (!course) return null;
    await course.update({ status: 'rejected' });
    logger.info({ courseId: id }, 'Course rejected');
    return course;
  }

  /**
   * Administrative & User CRUD operations
   */
  async getAllCoursesAdmin() {
    const courses = await Course.findAll({
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Lesson, as: 'lessons', attributes: ['id', 'title', 'order', 'status'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return CourseDto.formatMany(courses);
  }

  async getCourseById(id) {
    const course = await Course.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Lesson, as: 'lessons' },
      ],
    });
    return CourseDto.formatOne(course);
  }

  async createCourse({ title, description, body, coverImage, difficultyLevel, categoryId, estimatedHours, userId, status }) {
    const slug = this.generateSlug(title) + '-' + Date.now().toString().slice(-4);
    const course = await Course.create({
      title,
      slug,
      description,
      body,
      coverImage,
      difficultyLevel: difficultyLevel || 'Intermediate',
      categoryId: categoryId || null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
      userId: userId || null,
      status: status || 'published',
    });
    logger.info({ courseId: course.id, title, status: course.status }, 'Created new course');
    return course;
  }

  async updateCourse(id, { title, description, body, coverImage, difficultyLevel, categoryId, estimatedHours, status }) {
    const course = await Course.findByPk(id);
    if (!course) return null;

    const updateData = {
      title: title || course.title,
      description: description !== undefined ? description : course.description,
      body: body !== undefined ? body : course.body,
      difficultyLevel: difficultyLevel || course.difficultyLevel,
      categoryId: categoryId || course.categoryId,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : course.estimatedHours,
    };

    if (coverImage) updateData.coverImage = coverImage;
    if (status) updateData.status = status;

    await course.update(updateData);
    logger.info({ courseId: id }, 'Updated course details');
    return course;
  }

  async deleteCourse(id, userId = null) {
    const where = { id };
    if (userId) where.userId = userId;

    const course = await Course.findOne({ where });
    if (!course) return false;

    await Lesson.destroy({ where: { courseId: id } });
    await CourseProgress.destroy({ where: { courseId: id } });
    await course.destroy();
    logger.info({ courseId: id }, 'Deleted course and related lessons');
    return true;
  }

  async createLesson(courseId, { title, body, order }) {
    const slug = this.generateSlug(title) + '-' + Date.now().toString().slice(-4);
    const lesson = await Lesson.create({
      courseId,
      title,
      slug,
      body,
      order: order ? parseInt(order, 10) : 1,
      status: 'published',
    });

    const lessonsCount = await Lesson.count({ where: { courseId } });
    await Course.update({ lessonsCount }, { where: { id: courseId } });

    logger.info({ lessonId: lesson.id, courseId }, 'Created new lesson in course');
    return lesson;
  }

  async updateLesson(id, { title, body, order }) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return null;

    await lesson.update({
      title: title || lesson.title,
      body: body || lesson.body,
      order: order !== undefined ? parseInt(order, 10) : lesson.order,
    });

    logger.info({ lessonId: id }, 'Updated lesson');
    return lesson;
  }

  async deleteLesson(id) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return false;

    const courseId = lesson.courseId;
    await CourseProgress.destroy({ where: { lessonId: id } });
    await lesson.destroy();

    const lessonsCount = await Lesson.count({ where: { courseId } });
    await Course.update({ lessonsCount }, { where: { id: courseId } });

    logger.info({ lessonId: id, courseId }, 'Deleted lesson');
    return true;
  }

  async getCoursesCount() {
    return await Course.count({ where: { status: 'published' } });
  }
}

module.exports = new CourseService();
