const { AppError } = require('../errors/AppError');

const validateQuiz = (req, res, next) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Questions array is required', 400);
  }

  questions.forEach((question, index) => {
    if (!question.question) {
      throw new AppError(`Question text is required for question ${index + 1}`, 400);
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new AppError(`At least 2 options are required for question ${index + 1}`, 400);
    }
    if (!question.answer) {
      throw new AppError(`Answer is required for question ${index + 1}`, 400);
    }
    if (!question.options.includes(question.answer)) {
      throw new AppError(`Answer must be one of the options for question ${index + 1}`, 400);
    }
  });

  next();
};

module.exports = validateQuiz; 