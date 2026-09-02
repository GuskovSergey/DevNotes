const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReadingHistory = sequelize.define('ReadingHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  readAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'reading_history',
  timestamps: true,
});

module.exports = ReadingHistory;
