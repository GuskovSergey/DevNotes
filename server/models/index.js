const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const Category = require('./Category');
const Comment = require('./Comment');
const Tag = require('./Tag');
const PostTag = require('./PostTag');

// User <-> Post
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Category <-> Post
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Post <-> Comment
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post <-> Tag (Many-to-Many through PostTag)
Post.belongsToMany(Tag, { through: PostTag, foreignKey: 'postId', as: 'tags' });
Tag.belongsToMany(Post, { through: PostTag, foreignKey: 'tagId', as: 'posts' });

module.exports = {
  sequelize,
  User,
  Post,
  Category,
  Comment,
  Tag,
  PostTag,
};
