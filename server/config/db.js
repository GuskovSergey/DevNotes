const { sequelize } = require('../models');
const logger = require('./logger');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully with SQLite.');
    
    // Sync models in development mode
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Database models synchronized successfully.');
    }
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to the database');
    process.exit(1);
  }
};

module.exports = connectDB;
