const { Course, Lesson, Category, User } = require('./models');
const logger = require('./config/logger');

async function seedCourses() {
  try {
    const existingCount = await Course.count();
    if (existingCount > 0) {
      console.log('✓ Course database already contains data.');
      return;
    }

    let adminUser = await User.findOne({ where: { role: 'admin' } });
    if (!adminUser) {
      adminUser = await User.findOne();
    }

    let defaultCategory = await Category.findOne();
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'Architecture', slug: 'architecture' });
    }

    const course = await Course.create({
      title: 'Node.js Production Architecture & Systems Engineering',
      slug: 'nodejs-production-architecture',
      description: 'A comprehensive, hands-on engineering course on building high-concurrency Node.js microservices, SQLite/Sequelize ORM optimization, and zero-downtime Express patterns.',
      body: `## About This Course

Welcome to **Node.js Production Architecture & Systems Engineering**! This course is designed for backend engineers, system architects, and senior JavaScript developers who want to master production-grade Node.js services.

### What You Will Learn
1. **Event Loop & Asynchronous Control Flow**: Avoiding blocking loops and managing memory efficiently.
2. **Sequelize & SQLite Optimization**: Short transactions, indexing, and preventing N+1 queries.
3. **Security & Resiliency**: CSRF protection, rate limiting, and Pino structured JSON logging.
4. **Clean Code & MVC Architecture**: Controller-Service-DTO layered architecture.`,
      coverImage: null,
      difficultyLevel: 'Intermediate',
      status: 'published',
      categoryId: defaultCategory ? defaultCategory.id : null,
      userId: adminUser ? adminUser.id : null,
      lessonsCount: 4,
      estimatedHours: 3.5,
    });

    const lessonsData = [
      {
        courseId: course.id,
        title: '1. Event Loop Fundamentals & Non-Blocking Async Patterns',
        slug: 'event-loop-fundamentals',
        order: 1,
        status: 'published',
        body: `## Lesson 1: Master the Node.js Event Loop

Node.js relies on a single-threaded event-driven architecture powered by **libuv**. Understanding how tasks are queued across phases is essential for building low-latency backend microservices.

\`\`\`javascript
// Example: Avoid blocking the main event loop thread
const fs = require('fs').promises;

async function processLargeDataset(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  // Process asynchronously without blocking main looper
  return JSON.parse(data);
}
\`\`\`

### Key Takeaways
- **Timers Phase**: Executes callbacks scheduled by \`setTimeout()\` and \`setInterval()\`.
- **Pending Callbacks Phase**: Executes I/O callbacks deferred to the next loop iteration.
- **Poll Phase**: Retrieves new I/O events; executes I/O related callbacks.
- **Check Phase**: \`setImmediate()\` callbacks are invoked here immediately after Poll phase.`,
      },
      {
        courseId: course.id,
        title: '2. Express MVC & Controller-Service-DTO Architecture',
        slug: 'express-mvc-dto-architecture',
        order: 2,
        status: 'published',
        body: `## Lesson 2: Layered MVC & DTO Abstractions

To keep Express microservices maintainable as codebases scale, we decouple HTTP handling (Controllers), Business Logic (Services), and Presentation Formatting (Data Transfer Objects - DTOs).

\`\`\`javascript
// Controller: Extracts request & delegates to Service
const getPostPage = catchAsync(async (req, res, next) => {
  const post = await postService.getPostById(req.params.id);
  if (!post) return next(new Error('Post Not Found'));
  
  res.render('post', { post });
});
\`\`\`

### Architecture Layers
1. **Routes Layer**: Modular Express \`Router\` handling endpoints.
2. **Controller Layer**: Extracts \`req.params\` / \`req.body\` and returns response via DTOs.
3. **Service Layer**: Pure business logic and database orchestration.
4. **DTO Layer**: Formats database instances into safe view models.`,
      },
      {
        courseId: course.id,
        title: '3. SQLite & Sequelize ORM Concurrency Optimization',
        slug: 'sqlite-sequelize-concurrency',
        order: 3,
        status: 'published',
        body: `## Lesson 3: Database Indexing & N+1 Query Elimination

SQLite is extremely fast for read-heavy backend workloads when properly configured with short transactions and explicit eager loading.

\`\`\`javascript
// Eager load relations to prevent N+1 query performance traps
const posts = await Post.findAll({
  include: [
    { model: Category, as: 'category' },
    { model: User, as: 'author', attributes: ['id', 'username', 'displayName'] },
  ],
  order: [['createdAt', 'DESC']],
});
\`\`\`

### Best Practices for SQLite + Sequelize
- **Short Transactions**: Keep write transactions minimal to avoid \`SQLITE_BUSY\` write lock contention.
- **Eager Loading**: Use Sequelize \`include\` to fetch foreign relations in a single query.
- **Indexed Foreign Keys**: Ensure \`categoryId\`, \`userId\`, and \`slug\` columns are indexed.`,
      },
      {
        courseId: course.id,
        title: '4. High-Performance Logging with Pino & Resilient Error Handling',
        slug: 'pino-logging-error-handling',
        order: 4,
        status: 'published',
        body: `## Lesson 4: Structured Logging & Centralized Middleware

In production Node.js applications, standard \`console.log\` blocks execution synchronously. Use high-performance JSON loggers like **Pino** along with centralized Express error middleware.

\`\`\`javascript
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});

logger.info({ userId: 42, event: 'user_login' }, 'User logged in successfully');
\`\`\`

### Centralized Error Handler Pattern
Always catch async errors with a \`catchAsync\` wrapper utility and pass them to \`next(error)\` so the global error handling middleware renders user-friendly HTTP pages without leaking stack traces.`,
      },
    ];

    for (const lessonData of lessonsData) {
      await Lesson.create(lessonData);
    }

    console.log(`✓ Successfully seeded Demo Course "${course.title}" with 4 technical lessons!`);
  } catch (err) {
    console.error('Error seeding courses:', err);
  }
}

if (require.main === module) {
  seedCourses().then(() => process.exit(0));
}

module.exports = seedCourses;
