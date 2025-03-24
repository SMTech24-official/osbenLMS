const express = require('express');
const auth = require('../../middlewares/auth');
const validateQuiz = require('../../middlewares/validateQuiz');
const quizController = require('./quiz.controller');
const router = express.Router();

// Create quiz (Provider/Admin only)
router.post(
  '/courses/:courseId/quiz',
  auth('ADMIN', 'PROVIDER'),
  validateQuiz,
  quizController.createQuiz
);

// Submit quiz attempt (Students only)
router.post(
  '/:quizId/submit',
  auth('USER'),
  quizController.submitQuizAttempt
);

module.exports = router; 