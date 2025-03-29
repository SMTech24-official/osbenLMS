const express = require('express');
const auth = require('../../middlewares/auth');
const reviewController = require('./review.controller');

const router = express.Router();

// Create a review for a course
router.post(
  '/courses/:courseId',
  auth('USER'),
  reviewController.createReview
);

// Get all reviews for a course
router.get(
  '/courses/:courseId',
  reviewController.getCourseReviews
);

// Get all reviews by the current user
router.get(
  '/my-reviews',
  auth('USER'),
  reviewController.getUserReviews
);

// Delete a review
router.delete(
  '/:reviewId',
  auth('USER'),
  reviewController.deleteReview
);

module.exports = router;
