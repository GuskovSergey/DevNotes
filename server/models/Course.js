const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  difficultyLevel: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Intermediate',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'published', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lessonsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  estimatedHours: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
  },
}, {
  tableName: 'courses',
  timestamps: true,
});

module.exports = Course;
