const { Op } = require('sequelize');
const { marked } = require('marked');
const InterviewQuestion = require('../models/InterviewQuestion');

class FaqService {
  /**
   * Get all published interview questions with optional filtering by category, difficulty & search term
   */
  async getAllQuestions(filters = {}) {
    const { category, difficulty, search } = filters;
    const where = { isPublished: true };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { question: { [Op.like]: q } },
        { answer: { [Op.like]: q } },
        { category: { [Op.like]: q } },
      ];
    }

    const questions = await InterviewQuestion.findAll({
      where,
      order: [['order', 'ASC'], ['id', 'ASC']],
    });

    return questions.map(q => {
      const raw = q.get({ plain: true });
      return {
        ...raw,
        answerHtml: raw.answer ? marked.parse(raw.answer) : '',
      };
    });
  }

  /**
   * Get unique available categories for filter tabs
   */
  async getCategories() {
    const categories = await InterviewQuestion.findAll({
      attributes: ['category'],
      group: ['category'],
      where: { isPublished: true },
    });
    return categories.map(c => c.category);
  }

  /**
   * Upvote a question (AJAX handler)
   */
  async upvoteQuestion(id) {
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return null;

    question.upvotesCount += 1;
    await question.save();
    return question.upvotesCount;
  }

  /**
   * Admin: Get all questions including draft status
   */
  async getAdminAllQuestions() {
    const questions = await InterviewQuestion.findAll({
      order: [['order', 'ASC'], ['id', 'DESC']],
    });
    return questions.map(q => q.get({ plain: true }));
  }

  /**
   * Admin: Create new interview question
   */
  async createQuestion(data) {
    const slug = data.slug || data.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return await InterviewQuestion.create({
      question: data.question,
      slug,
      answer: data.answer,
      category: data.category || 'Node.js Core',
      difficulty: data.difficulty || 'Mid',
      order: parseInt(data.order, 10) || 0,
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    });
  }

  /**
   * Admin: Update interview question by ID
   */
  async updateQuestion(id, data) {
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return null;

    const slug = data.slug || data.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    question.question = data.question || question.question;
    question.slug = slug;
    question.answer = data.answer || question.answer;
    question.category = data.category || question.category;
    question.difficulty = data.difficulty || question.difficulty;
    question.order = data.order !== undefined ? parseInt(data.order, 10) : question.order;
    question.isPublished = data.isPublished !== undefined ? Boolean(data.isPublished) : question.isPublished;

    await question.save();
    return question;
  }

  /**
   * Admin: Delete interview question by ID
   */
  async deleteQuestion(id) {
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return false;
    await question.destroy();
    return true;
  }
}

module.exports = new FaqService();
