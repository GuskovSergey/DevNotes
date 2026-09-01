const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN } = require('../config/constants');

class AuthService {
  async validateCredentials(username, password) {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async registerUser(username, password) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      const error = new Error('User already in use');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    return {
      id: user.id,
      username: user.username,
    };
  }

  generateToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is missing.');
    }
    return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
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
