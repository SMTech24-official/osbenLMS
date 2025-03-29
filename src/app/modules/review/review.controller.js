const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const reviewService = require('./review.service');

const createReview = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const reviewData = req.body;

  const result = await reviewService.createReview(userId, courseId, reviewData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review submitted successfully',
    data: result
  });
});

const getCourseReviews = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { page, limit } = req.query;

  const result = await reviewService.getCourseReviews(courseId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course reviews retrieved successfully',
    meta: result.meta,
    data: result.data
  });
});

const getUserReviews = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;

  const result = await reviewService.getUserReviews(userId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User reviews retrieved successfully',
    meta: result.meta,
    data: result.data
  });
});

const deleteReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const result = await reviewService.deleteReview(userId, reviewId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: result
  });
});

module.exports = {
  createReview,
  getCourseReviews,
  getUserReviews,
  deleteReview
};
