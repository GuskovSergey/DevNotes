const { Category, Post, Course } = require('../models');

class CategoryService {
  async getAllCategories() {
    return await Category.findAll({
      order: [['name', 'ASC']],
    });
  }

  async getAllCategoriesWithCounts() {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const postsCount = await Post.count({
          where: { categoryId: cat.id, status: 'published' },
        });
        return {
          ...cat.toJSON(),
          postsCount,
        };
      })
    );

    return categoriesWithCount;
  }

  async getCategoryBySlug(slug) {
    return await Category.findOne({
      where: { slug },
    });
  }

  async createCategory({ name, slug }) {
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return await Category.create({
      name,
      slug: generatedSlug,
    });
  }

  async updateCategory(id, { name, slug }) {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    if (name) category.name = name;
    if (slug) category.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await category.save();
    return category;
  }

  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    await Post.update({ categoryId: null }, { where: { categoryId: id } });
    if (Course) {
      await Course.update({ categoryId: null }, { where: { categoryId: id } });
    }

    await category.destroy();
    return true;
  }
}

module.exports = new CategoryService();
