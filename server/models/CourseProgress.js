const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseProgress = sequelize.define('CourseProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'course_progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId', 'lessonId'],
    },
  ],
});

module.exports = CourseProgress;
