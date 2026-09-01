require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Post, User, Category, Comment } = require('./models');
const { BCRYPT_SALT_ROUNDS } = require('./config/constants');
const logger = require('./config/logger');

const seedDB = async () => {
  try {
    // Force sync for SQLite schema migration during development setup
    await sequelize.sync({ force: true });
    logger.info('Sequelize models synchronized with SQLite database.');

    // Seed Categories
    const techCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
    });

    const devCategory = await Category.create({
      name: 'Development',
      slug: 'development',
    });

    // Seed Posts
    const posts = await Post.bulkCreate([
      {
        title: "Building APIs with Node.js & Express",
        body: "Learn how to use Node.js to build RESTful APIs using frameworks like Express.js and Sequelize ORM with SQLite database.",
        categoryId: devCategory.id,
        viewsCount: 15,
      },
      {
        title: "Deployment of Node.js applications",
        body: "Understand the different ways to deploy your Node.js applications, including on-premises, cloud, and container environments.",
        categoryId: techCategory.id,
        viewsCount: 8,
      },
      {
        title: "Authentication and Authorization in Node.js",
        body: "Learn how to add authentication and authorization to your Node.js web applications using JWT and bcrypt.",
        categoryId: devCategory.id,
        viewsCount: 22,
      },
    ]);

    // Seed sample comment
    await Comment.create({
      postId: posts[0].id,
      authorName: "Alexey",
      authorEmail: "alexey@example.com",
      content: "Great tutorial on Express MVC architecture!",
      isApproved: true,
    });

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('admin123', BCRYPT_SALT_ROUNDS);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@devhub.com',
      displayName: 'System Admin',
      role: 'admin',
    });

    logger.info('Default admin user (admin / admin123) and initial data seeded into SQLite successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error seeding database');
  }
};

seedDB();
