const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN } = require('../config/constants');

class AuthService {
  async validateCredentials(username, password) {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async registerUser({ username, email, password, displayName, role = 'user' }) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      const error = new Error(`${field} is already in use`);
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      role,
    });

    return user;
  }

  async getUserById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
  }

  async getAllUsers() {
    return await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  }

  async updateProfile(id, { displayName, email, bio, githubUrl, twitterUrl, websiteUrl, avatarUrl, removeAvatar }) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        const error = new Error('Email is already in use by another account');
        error.statusCode = 409;
        throw error;
      }
      user.email = email;
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (githubUrl !== undefined) user.githubUrl = githubUrl || null;
    if (twitterUrl !== undefined) user.twitterUrl = twitterUrl || null;
    if (websiteUrl !== undefined) user.websiteUrl = websiteUrl || null;

    if (removeAvatar === true || removeAvatar === 'true' || removeAvatar === '1') {
      user.avatarUrl = null;
    } else if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();
    return user;
  }

  async changePassword(id, oldPassword, newPassword) {
    const user = await User.findByPk(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();
    return true;
  }

  generateToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is missing.');
    }
    const payload = typeof user === 'object' 
      ? { userId: user.id, role: user.role, username: user.username } 
      : { userId: user };
    return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is missing.');
    }
    return jwt.verify(token, secret);
  }
}

module.exports = new AuthService();
