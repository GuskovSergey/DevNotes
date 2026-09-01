const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostTag = sequelize.define('PostTag', {
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id',
    },
  },
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id',
    },
  },
}, {
  tableName: 'post_tags',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['postId', 'tagId'],
    },
  ],
});

module.exports = PostTag;
