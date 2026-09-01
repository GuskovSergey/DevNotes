const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('./logger');

const dbPath = process.env.DB_STORAGE 
  ? path.resolve(process.env.DB_STORAGE)
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize;
