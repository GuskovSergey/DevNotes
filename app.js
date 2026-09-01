require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const helmet = require('helmet');
const pinoHttp = require('pino-http');

const logger = require('./server/config/logger');
const connectDB = require('./server/config/db');
const { sequelize } = require('./server/models');
const { isActiveRoute } = require('./server/helpers/routeHelpers');
const { attachCsrfToken } = require('./server/middlewares/csrfMiddleware');
const { optionalAuthMiddleware } = require('./server/middlewares/authMiddleware');
const errorHandler = require('./server/middlewares/errorHandler');
const { DEFAULT_PORT } = require('./server/config/constants');

const app = express();
const PORT = process.env.PORT || DEFAULT_PORT;

// Connect DB & sync session store
connectDB();

const sessionStore = new SequelizeStore({
  db: sequelize,
});
sessionStore.sync();

// Structured Logging Middleware
app.use(pinoHttp({ logger }));

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Body Parsing & Utilities
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Session Management (SQLite Session Store)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      maxAge: 3600000, // 1 hour
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use(express.static('public'));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Global Helpers, Optional Auth Locals & CSRF Token
app.locals.isActiveRoute = isActiveRoute;
app.use(optionalAuthMiddleware); // Must run before attachCsrfToken so req.userId is available for getSessionIdentifier
app.use(attachCsrfToken);

// Routes
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));
app.use('/', require('./server/routes/user'));

// 404 Handler
app.use((req, res, next) => {
  const error = new Error('Page Not Found');
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`App listening on port ${PORT}`);
});
