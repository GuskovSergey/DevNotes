const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const Category = require('./Category');
const Comment = require('./Comment');

// User <-> Post
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Category <-> Post
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Post <-> Comment
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

module.exports = {
  sequelize,
  User,
  Post,
  Category,
  Comment,
};
