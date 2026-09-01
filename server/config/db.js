const { sequelize, User } = require('../models');
const authService = require('../services/authService');
const logger = require('./logger');

const seedAdminUser = async () => {
  try {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await authService.registerUser({
        username: 'admin',
        email: 'admin@devhub.com',
        password: 'AdminPassword123!',
        displayName: 'System Admin',
        role: 'admin',
      });
      logger.info('Default admin user pre-created (username: admin, email: admin@devhub.com)');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to seed default admin user');
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully with SQLite.');
    
    // Sync models in development mode
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Database models synchronized successfully.');
      await seedAdminUser();
    }
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to the database');
    process.exit(1);
  }
};

module.exports = connectDB;
