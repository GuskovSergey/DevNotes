---
trigger: always_on
---

# Express MVC & Sequelize Best Practices

You are an expert in Node.js, Express, Sequelize ORM, and EJS templating. Focus on building robust, Server-Side Rendered (SSR) applications using the Model-View-Controller (MVC) architectural pattern.

## Key Principles
- Strictly adhere to the MVC pattern. Keep a clear boundary between Models (data & business logic), Views (EJS templates), and Controllers (HTTP request/response handling).
- Keep Controllers thin. Delegate complex data manipulation to Services or fat Models.
- Favor asynchronous programming with `async/await`. Avoid callback hell or deeply nested `.then()` chains.
- Apply Object-Oriented Design (OOD) where appropriate for business logic layers.

## Controllers & Routing
- Use Express `Router` to modularize route definitions. Group related routes in dedicated files (e.g., `userRoutes.js`).
- Controllers should extract request data (`req.body`, `req.query`, `req.params`), pass it to Models/Services, and return a response via `res.render()` for views or `res.json()` for APIs.
- Never place database query logic directly inside the Express route definition.

## Database & Models (Sequelize + SQLite)
- Define Sequelize models explicitly. Use migrations to manage SQLite database schema changes rather than `sync({ force: true })` in production.
- Account for SQLite's lack of high concurrency. Keep transactions short and avoid heavy concurrent write operations.
- Prevent the N+1 query problem by using Sequelize's `include` for eager loading related models when iterating over data in EJS views.

## Views (EJS)
- Keep EJS templates strictly for presentation. Do not put complex business logic, data fetching, or heavy data transformations inside `.ejs` files.
- Pass fully formatted, ready-to-display data structures (DTOs or View Models) from the Controller to the EJS view.
- Utilize EJS partials (`<%- include('partials/header') %>`) extensively to reuse UI components like headers, footers, and navigation bars.
- Always escape user input using `<%= value %>` to prevent Cross-Site Scripting (XSS). Only use `<%- value %>` for trusted HTML.

## Logging, Error Handling & Security
- Never use `console.log`. Always use Pino (`pino` / `pino-http`) for high-performance, structured JSON logging across the application.
- Centralize error handling using an Express global error-handling middleware `(err, req, res, next)`.
- Do not crash the Node process on unhandled promise rejections; catch errors in async controller methods (e.g., wrap with a custom `catchAsync` utility) and pass them to `next()`.
- Provide user-friendly error pages (e.g., `error.ejs`) for SSR routes, rather than leaking stack traces to the client.
- Implement CSRF (Cross-Site Request Forgery) protection for all state-changing EJS form submissions.
- Use `helmet` middleware to set secure HTTP headers.
- Validate and sanitize all form inputs from `req.body` before passing them to Sequelize.

## Code Style & Clean Code
- Enforce standard naming conventions: `PascalCase` for Sequelize Models and Classes, `camelCase` for variables, functions, and instances, `UPPER_SNAKE_CASE` for global constants.
- Avoid "magic numbers" and "magic strings". Extract them into named constants or configuration files.
- Use "Early Returns" (Guard Clauses) in controllers and services to avoid deep `if/else` nesting and improve readability.
- Keep environment variables out of the codebase. Always use `dotenv` (`process.env.VAR_NAME`) for configuration and secrets.
- Assume the project uses standard linters (ESLint/Prettier); write consistently formatted code (e.g., consistent quote usage, indentation, and trailing commas).