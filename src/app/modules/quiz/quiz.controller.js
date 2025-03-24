const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const quizService = require('./quiz.service');

const createQuiz = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await quizService.createQuiz(courseId, req.body.questions);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Quiz created successfully',
    data: result,
  });
});

const submitQuizAttempt = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const result = await quizService.submitQuizAttempt(req.user.id, quizId, req.body.answers);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Quiz submitted successfully',
    data: result,
  });
});

module.exports = {
  createQuiz,
  submitQuizAttempt,
}; 