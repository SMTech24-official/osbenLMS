const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const routes = require('./app/routes');
const globalErrorHandler = require('./app/middlewares/globalErrorHandler');
const { scheduleUserCleanup, scheduleSubscriptionChecks } = require('./app/utils/cronJobs');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://138.197.77.144:3000',
    'http://138.197.77.144:8020',
    'http://solidfoundationacademy.org',
    'http://www.solidfoundationacademy.org',
    'http://api.solidfoundationacademy.org',
    'http://dashboard.solidfoundationacademy.org',
    'http://dev.solidfoundationacademy.org',
    'https://osben.vercel.app',
    'https://osben-dashboard.vercel.app',
    'https://osben88yahoocom-dashboard.vercel.app',
    'https://solidfoundationacademy.org',
    'https://www.solidfoundationacademy.org',
    'https://lms-dashboard-kappa.vercel.app',
    'https://lms-frontend-tau-vert.vercel.app',
    'https://api.solidfoundationacademy.org',
    'https://dashboard.solidfoundationacademy.org',
    'https://dev.solidfoundationacademy.org',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
}));
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1', routes);

// Health checker
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Handle Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
  next();
});

// Global Error Handler
app.use(globalErrorHandler);

// Initialize cron jobs
scheduleUserCleanup();
scheduleSubscriptionChecks();

module.exports = app;
