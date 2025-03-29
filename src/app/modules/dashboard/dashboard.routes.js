const express = require('express');
const auth = require('../../middlewares/auth');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

// Protect all dashboard routes - require authentication
router.use(auth());

// Dashboard summary statistics
router.get('/summary', dashboardController.getDashboardSummary);

// User registrations by month for yearly overview
router.get('/registrations/monthly', dashboardController.getUserRegistrationsByMonth);

// User registrations by day for specific month (for chart)
router.get('/registrations/daily', dashboardController.getUserRegistrationsByDay);

module.exports = router;
