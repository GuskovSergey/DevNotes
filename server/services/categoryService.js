const { Category, Post } = require('../models');

class CategoryService {
  async getAllCategories() {
    return await Category.findAll({
      order: [['name', 'ASC']],
    });
  }

  async getCategoryBySlug(slug) {
    return await Category.findOne({
      where: { slug },
    });
  }

  async createCategory({ name, slug }) {
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return await Category.create({
      name,
      slug: generatedSlug,
    });
  }
}

module.exports = new CategoryService();
