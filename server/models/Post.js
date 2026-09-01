const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  featuredImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'published', 'rejected'),
    defaultValue: 'published',
    allowNull: false,
  },
  seriesId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  seriesOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  difficultyLevel: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Intermediate',
    allowNull: false,
  },
}, {
  tableName: 'posts',
  timestamps: true,
});

module.exports = Post;