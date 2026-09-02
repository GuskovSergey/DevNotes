const sequelize = require('../config/database');
const InterviewQuestion = require('../models/InterviewQuestion');

const sampleQuestions = [
  {
    question: 'How does the Node.js Event Loop work under the hood, and how do you prevent main thread starvation?',
    slug: 'nodejs-event-loop-architecture',
    category: 'Node.js Core',
    difficulty: 'Senior',
    order: 1,
    upvotesCount: 48,
    viewsCount: 312,
    answer: `Node.js operates on a single-threaded event loop backed by **libuv** for asynchronous I/O primitives and worker threads.

### Phases of the Event Loop:
1. **Timers**: Executes callbacks scheduled by \`setTimeout()\` and \`setInterval()\`.
2. **Pending Callbacks**: Executes I/O callbacks deferred from previous operations.
3. **Idle / Prepare**: Internal internal engine phase.
4. **Poll**: Retrieves new I/O events; executes I/O related callbacks.
5. **Check**: Executes \`setImmediate()\` callbacks.
6. **Close Callbacks**: Executes socket teardowns (e.g. \`socket.on('close')\`).

### Preventing Event Loop Starvation:
- Offload CPU-bound calculations (cryptography, image transformations) to **Worker Threads** (\`worker_threads\` module).
- Never use synchronous file operations (\`fs.readFileSync\`) inside HTTP controllers.
- Delegate large loop iterations to micro-tasks using \`setImmediate()\` to allow pending I/O to run.`
  },
  {
    question: 'What is the N+1 Query Problem in ORMs (Sequelize), and how do you resolve it in Express applications?',
    slug: 'orm-n-plus-1-query-problem-sequelize',
    category: 'Databases & SQL',
    difficulty: 'Mid',
    order: 2,
    upvotesCount: 35,
    viewsCount: 240,
    answer: `The **N+1 Query Problem** occurs when an application executes 1 query to fetch $N$ parent items (e.g. 10 Posts), and then executes $N$ additional database queries inside a loop to fetch associated child entities (e.g., Comments for each Post).

### Example of Broken Code ($N+1$ Queries):
\`\`\`javascript
// BAD: Executes 1 + 10 queries
const posts = await Post.findAll();
for (const post of posts) {
  const comments = await Comment.findAll({ where: { postId: post.id } });
}
\`\`\`

### Optimized Solution (Eager Loading in 1 Query):
\`\`\`javascript
// GOOD: Executes 1 optimized SQL JOIN query
const posts = await Post.findAll({
  include: [{ model: Comment, as: 'comments' }]
});
\`\`\`

**Best Practice**: Always inspect raw SQL output during development using logger middleware or Pino logging.`
  },
  {
    question: 'How do you handle race conditions and concurrency limits in SQLite when building Node.js web services?',
    slug: 'sqlite-concurrency-write-locks-nodejs',
    category: 'Databases & SQL',
    difficulty: 'Senior',
    order: 3,
    upvotesCount: 29,
    viewsCount: 185,
    answer: `SQLite uses file-level write locking by default. When multiple concurrent web requests attempt to mutate records simultaneously, SQLite can return a \`SQLITE_BUSY: database is locked\` error.

### Production Mitigation Strategies:
1. **Enable WAL Mode (Write-Ahead Logging)**:
   WAL mode allows readers to read concurrently while a write operation is occurring.
   \`\`\`sql
   PRAGMA journal_mode = WAL;
   \`\`\`
2. **Increase Busy Timeout**:
   Set \`busyTimeout: 5000\` in Sequelize/SQLite connection settings so transactions retry instead of immediately failing.
3. **Keep Transactions Short**:
   Perform external API calls, password hashing (bcrypt), and validation **before** entering the DB transaction block.`
  },
  {
    question: 'What is CSRF (Cross-Site Request Forgery), and how is it mitigated in Express MVC applications?',
    slug: 'csrf-protection-express-mvc-security',
    category: 'Security & Web',
    difficulty: 'Mid',
    order: 4,
    upvotesCount: 41,
    viewsCount: 275,
    answer: `**CSRF** occurs when a malicious website tricks a user's browser into sending unauthorized HTTP requests to an application where the user is currently authenticated via cookies.

### Defense-in-Depth Mechanisms:
1. **CSRF Tokens (Double Submit Cookie / Synchronizer Token)**:
   Generate a cryptographic token per session. Form submissions must submit this token via \`<input type="hidden" name="_csrf" value="...">\` or headers.
2. **SameSite Cookie Attribute**:
   Set \`SameSite=Lax\` or \`SameSite=Strict\` on session cookies to prevent browsers from attaching cookies on cross-site requests.
3. **Helmet HTTP Security Headers**:
   Use \`helmet()\` middleware to enforce CSP, HSTS, and X-Content-Type-Options.`
  },
  {
    question: 'Why should you avoid console.log in Node.js production code, and what are the advantages of structured logging (Pino)?',
    slug: 'pino-structured-logging-vs-console-log',
    category: 'System Architecture',
    difficulty: 'Junior',
    order: 5,
    upvotesCount: 38,
    viewsCount: 210,
    answer: `\`console.log\` in Node.js is **synchronous** when writing to stdout in standard terminal settings, causing thread blocking under heavy load. Furthermore, unformatted text strings make log aggregators (Datadog, Elastic) hard to query.

### Advantages of Pino Logger:
- **Asynchronous & High-Performance**: Uses worker threads and buffered streams for minimal overhead.
- **Structured JSON Output**: Every log entry includes timestamps, process IDs, log levels, and request context.
- **Log Correlation**: Attach \`reqId\` (request ID) to trace requests across controllers and database services.`
  }
];

async function seedFaq() {
  try {
    await sequelize.sync();

    for (const qData of sampleQuestions) {
      const [question, created] = await InterviewQuestion.findOrCreate({
        where: { slug: qData.slug },
        defaults: qData,
      });

      if (created) {
        console.log(`✓ Seeded Interview Question: "${qData.question.substring(0, 50)}..."`);
      } else {
        console.log(`- Interview Question already exists: "${qData.question.substring(0, 50)}..."`);
      }
    }

    console.log('✓ All Interview Questions successfully seeded into SQLite database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding interview questions:', err);
    process.exit(1);
  }
}

seedFaq();
