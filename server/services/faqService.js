const { Op } = require('sequelize');
const { marked } = require('marked');
const InterviewQuestion = require('../models/InterviewQuestion');
const FaqAnswer = require('../models/FaqAnswer');
const User = require('../models/User');
const notificationService = require('./notificationService');

class FaqService {
  /**
   * Get all published interview questions with optional filtering by category, difficulty & search term
   */
  async getAllQuestions(filters = {}) {
    const { category, difficulty, search } = filters;
    const where = { isPublished: true, status: 'approved' };

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
      include: [
        {
          model: FaqAnswer,
          as: 'communityAnswers',
          where: { status: 'approved' },
          required: false,
          include: [{ model: User, as: 'author', attributes: ['id', 'username', 'displayName', 'avatarUrl'] }]
        }
      ],
      order: [['order', 'ASC'], ['id', 'ASC']],
    });

    return questions.map(q => {
      const raw = q.get({ plain: true });
      return {
        ...raw,
        answerHtml: raw.answer ? marked.parse(raw.answer) : '',
        communityAnswers: raw.communityAnswers ? raw.communityAnswers.map(ca => ({
          ...ca,
          answerHtml: ca.answer ? marked.parse(ca.answer) : '',
        })) : [],
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
      where: { isPublished: true, status: 'approved' },
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
   * User: Submit a new question (requires admin approval)
   */
  async submitUserQuestion(userId, data) {
    const slug = (data.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now()).substring(0, 80);
    return await InterviewQuestion.create({
      userId,
      question: data.question,
      slug,
      answer: data.answer || 'Question submitted by developer. Pending model answer.',
      category: data.category || 'Node.js Core',
      difficulty: data.difficulty || 'Mid',
      status: 'pending',
      isPublished: false,
    });
  }

  /**
   * User: Submit an answer to an existing question (requires admin approval)
   */
  async submitUserAnswer(userId, questionId, text) {
    return await FaqAnswer.create({
      userId,
      questionId: parseInt(questionId, 10),
      answer: text,
      status: 'pending',
    });
  }

  /**
   * Admin: Get pending questions and answers count
   */
  async getPendingFaqCount() {
    const pendingQuestionsCount = await InterviewQuestion.count({ where: { status: 'pending' } });
    const pendingAnswersCount = await FaqAnswer.count({ where: { status: 'pending' } });
    return pendingQuestionsCount + pendingAnswersCount;
  }

  /**
   * Admin: Get pending questions and answers for moderation queue
   */
  async getPendingSubmissions() {
    const questions = await InterviewQuestion.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'displayName'] }],
      order: [['createdAt', 'ASC']],
    });

    const answers = await FaqAnswer.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
        { model: InterviewQuestion, as: 'question', attributes: ['id', 'question'] }
      ],
      order: [['createdAt', 'ASC']],
    });

    return {
      questions: questions.map(q => {
        const raw = q.get({ plain: true });
        return { ...raw, answerHtml: raw.answer ? marked.parse(raw.answer) : '' };
      }),
      answers: answers.map(a => {
        const raw = a.get({ plain: true });
        return { ...raw, answerHtml: raw.answer ? marked.parse(raw.answer) : '' };
      }),
    };
  }

  /**
   * Admin: Approve a user-submitted question
   */
  async approveQuestion(id) {
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return null;

    question.status = 'approved';
    question.isPublished = true;
    await question.save();

    if (question.userId) {
      await notificationService.createNotification(
        question.userId,
        'question_approved',
        `Your interview question "${question.question.substring(0, 45)}..." has been approved and published!`,
        '/faq'
      );
    }
    return question;
  }

  /**
   * Admin: Reject a user-submitted question
   */
  async rejectQuestion(id, reason = '') {
    const question = await InterviewQuestion.findByPk(id);
    if (!question) return null;

    question.status = 'rejected';
    question.isPublished = false;
    await question.save();

    if (question.userId) {
      await notificationService.createNotification(
        question.userId,
        'question_rejected',
        `Your question submission was not approved. ${reason ? 'Reason: ' + reason : ''}`,
        '/my/questions'
      );
    }
    return question;
  }

  /**
   * Admin: Approve a user-submitted answer
   */
  async approveAnswer(id) {
    const answer = await FaqAnswer.findByPk(id);
    if (!answer) return null;

    answer.status = 'approved';
    await answer.save();

    if (answer.userId) {
      await notificationService.createNotification(
        answer.userId,
        'answer_approved',
        `Your community answer to interview question #${answer.questionId} has been approved!`,
        '/faq'
      );
    }
    return answer;
  }

  /**
   * Admin: Reject a user-submitted answer
   */
  async rejectAnswer(id, reason = '') {
    const answer = await FaqAnswer.findByPk(id);
    if (!answer) return null;

    answer.status = 'rejected';
    await answer.save();

    if (answer.userId) {
      await notificationService.createNotification(
        answer.userId,
        'answer_rejected',
        `Your answer submission was not approved. ${reason ? 'Reason: ' + reason : ''}`,
        '/my/questions'
      );
    }
    return answer;
  }

  /**
   * User: Get user's own submitted questions and answers for cabinet
   */
  async getUserSubmissions(userId) {
    const questions = await InterviewQuestion.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    const answers = await FaqAnswer.findAll({
      where: { userId },
      include: [{ model: InterviewQuestion, as: 'question', attributes: ['id', 'question'] }],
      order: [['createdAt', 'DESC']],
    });

    return {
      questions: questions.map(q => q.get({ plain: true })),
      answers: answers.map(a => {
        const raw = a.get({ plain: true });
        return { ...raw, answerHtml: raw.answer ? marked.parse(raw.answer) : '' };
      }),
    };
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
      status: 'approved',
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

  /**
   * Admin: Get all FAQ categories with question counts
   */
  async getFaqCategoriesWithCounts() {
    const questions = await InterviewQuestion.findAll({
      attributes: ['category'],
      raw: true,
    });
    const countsMap = {};
    questions.forEach(q => {
      const cat = q.category || 'Общее';
      countsMap[cat] = (countsMap[cat] || 0) + 1;
    });

    return Object.keys(countsMap).sort().map(name => ({
      name,
      questionsCount: countsMap[name],
    }));
  }

  /**
   * Admin: Rename FAQ category across all questions
   */
  async renameFaqCategory(oldName, newName) {
    if (!oldName || !newName) return false;
    await InterviewQuestion.update(
      { category: newName.trim() },
      { where: { category: oldName.trim() } }
    );
    return true;
  }

  /**
   * Admin: Delete FAQ category (reassign questions to 'Общее')
   */
  async deleteFaqCategory(categoryName) {
    if (!categoryName) return false;
    await InterviewQuestion.update(
      { category: 'Общее' },
      { where: { category: categoryName.trim() } }
    );
    return true;
  }
}

module.exports = new FaqService();
