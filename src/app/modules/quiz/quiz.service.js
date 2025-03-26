const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createQuiz = async (courseId, questions) => {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { quiz: true },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (course.quiz) {
    throw new AppError('Quiz already exists for this course', 400);
  }

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      questions: {
        createMany: {
          data: questions,
        },
      },
    },
    include: {
      questions: true,
    },
  });

  return quiz;
};

const submitQuizAttempt = async (userId, quizId, answers) => {
  // Check if quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  // Check if user has already attempted this quiz
  const existingAttempt = await prisma.quizAttempt.findUnique({
    where: {
      userId_quizId: {
        userId,
        quizId,
      },
    },
  });

  if (existingAttempt) {
    throw new AppError('You have already attempted this quiz', 400);
  }

  // Calculate score
  let score = 0;
  quiz.questions.forEach((question, index) => {
    if (question.answer === answers[index]) {
      score++;
    }
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score,
    },
    include: {
      quiz: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return attempt;
};

module.exports = {
  createQuiz,
  submitQuizAttempt,
}; 