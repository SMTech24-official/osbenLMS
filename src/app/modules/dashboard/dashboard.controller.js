const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const dashboardService = require('./dashboard.service');

/**
 * Get dashboard summary statistics
 * Returns total users, courses, and active subscriptions
 */
const getDashboardSummary = catchAsync(async (req, res) => {
  const result = await dashboardService.getDashboardSummary();
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: result
  });
});

/**
 * Get user registration data by month
 * Returns user count for each month in the specified year
 */
const getUserRegistrationsByMonth = catchAsync(async (req, res) => {
  const { year } = req.query;
  const result = await dashboardService.getUserRegistrationsByMonth(year);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User registrations by month retrieved successfully',
    data: result
  });
});

/**
 * Get user registration data by day for a specific month
 * Returns user count for each day in the specified month
 */
const getUserRegistrationsByDay = catchAsync(async (req, res) => {
  const { monthYear } = req.query;
  const result = await dashboardService.getUserRegistrationsByDay(monthYear || 'Jul, 2024');
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User registrations by day retrieved successfully',
    data: result
  });
});

module.exports = {
  getDashboardSummary,
  getUserRegistrationsByMonth,
  getUserRegistrationsByDay
};
