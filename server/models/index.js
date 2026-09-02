const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const Category = require('./Category');
const Comment = require('./Comment');
const Tag = require('./Tag');
const PostTag = require('./PostTag');

const Bookmark = require('./Bookmark');
const PostLike = require('./PostLike');
const Series = require('./Series');
const ReadingHistory = require('./ReadingHistory');
const Notification = require('./Notification');

const Course = require('./Course');
const Lesson = require('./Lesson');
const CourseProgress = require('./CourseProgress');

// User <-> Post
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Category <-> Post
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Series <-> Post
Series.hasMany(Post, { foreignKey: 'seriesId', as: 'posts' });
Post.belongsTo(Series, { foreignKey: 'seriesId', as: 'series' });

// Post <-> Comment
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Lesson <-> Comment (Optional lesson discussions)
Lesson.hasMany(Comment, { foreignKey: 'lessonId', as: 'comments' });
Comment.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// Comment <-> Comment (Threaded Replies)
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Bookmark
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> Bookmark
Post.hasMany(Bookmark, { foreignKey: 'postId', as: 'bookmarks' });
Bookmark.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User <-> PostLike
User.hasMany(PostLike, { foreignKey: 'userId', as: 'likes' });
PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> PostLike
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User <-> ReadingHistory
User.hasMany(ReadingHistory, { foreignKey: 'userId', as: 'readingHistory' });
ReadingHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> ReadingHistory
Post.hasMany(ReadingHistory, { foreignKey: 'postId', as: 'readingHistory' });
ReadingHistory.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> Tag (Many-to-Many through PostTag)
Post.belongsToMany(Tag, { through: PostTag, foreignKey: 'postId', as: 'tags' });
Tag.belongsToMany(Post, { through: PostTag, foreignKey: 'tagId', as: 'posts' });

// Course Associations
User.hasMany(Course, { foreignKey: 'userId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// CourseProgress Associations
User.hasMany(CourseProgress, { foreignKey: 'userId', as: 'courseProgress' });
CourseProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(CourseProgress, { foreignKey: 'courseId', as: 'progressRecords' });
CourseProgress.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Lesson.hasMany(CourseProgress, { foreignKey: 'lessonId', as: 'progressRecords' });
CourseProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

module.exports = {
  sequelize,
  User,
  Post,
  Category,
  Comment,
  Tag,
  PostTag,
  Bookmark,
  PostLike,
  Series,
  ReadingHistory,
  Notification,
  Course,
  Lesson,
  CourseProgress,
};
