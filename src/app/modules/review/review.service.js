const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createReview = async (userId, courseId, reviewData) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { 
      id: true,
      rating: true,
      totalRatings: true
    }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if user is enrolled in the course
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId
    }
  });

  if (!enrollment) {
    throw new AppError('You must be enrolled in this course to leave a review', 403);
  }

  // Check if user has already reviewed this course
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      courseId
    }
  });

  // Validate rating
  const rating = Number(reviewData.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be a number between 1 and 5', 400);
  }

  // Start a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    let review;
    let newAvgRating;
    let newTotalRatings;

    if (existingReview) {
      // Update existing review
      review = await tx.review.update({
        where: {
          id: existingReview.id
        },
        data: {
          rating,
          comment: reviewData.comment
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Recalculate course rating
      const allReviews = await tx.review.findMany({
        where: { courseId },
        select: { rating: true }
      });

      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      newAvgRating = totalRating / allReviews.length;
      newTotalRatings = allReviews.length;
    } else {
      // Create new review
      review = await tx.review.create({
        data: {
          rating,
          comment: reviewData.comment,
          userId,
          courseId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Calculate new average rating
      const oldRatingTotal = course.rating * course.totalRatings;
      newTotalRatings = course.totalRatings + 1;
      newAvgRating = (oldRatingTotal + rating) / newTotalRatings;
    }

    // Update course with new rating
    await tx.course.update({
      where: { id: courseId },
      data: {
        rating: newAvgRating,
        totalRatings: newTotalRatings
      }
    });

    return review;
  });
};

const getCourseReviews = async (courseId, page = 1, limit = 10) => {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  // Get reviews with pagination
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.review.count({
      where: { courseId }
    })
  ]);

  return {
    data: reviews,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

const getUserReviews = async (userId, page = 1, limit = 10) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  // Get user reviews with pagination
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.review.count({
      where: { userId }
    })
  ]);

  return {
    data: reviews,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

const deleteReview = async (userId, reviewId) => {
  // Check if review exists and belongs to user
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId
    },
    include: {
      course: {
        select: {
          id: true,
          rating: true,
          totalRatings: true
        }
      }
    }
  });

  if (!review) {
    throw new AppError('Review not found or you are not authorized to delete it', 404);
  }

  // Start a transaction
  return await prisma.$transaction(async (tx) => {
    // Delete the review
    await tx.review.delete({
      where: { id: reviewId }
    });

    // Recalculate course rating
    if (review.course.totalRatings > 1) {
      const allReviews = await tx.review.findMany({
        where: { courseId: review.course.id },
        select: { rating: true }
      });

      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const newAvgRating = totalRating / allReviews.length;

      await tx.course.update({
        where: { id: review.course.id },
        data: {
          rating: newAvgRating,
          totalRatings: allReviews.length
        }
      });
    } else {
      // If this was the only review, reset rating
      await tx.course.update({
        where: { id: review.course.id },
        data: {
          rating: 0,
          totalRatings: 0
        }
      });
    }

    return { message: 'Review deleted successfully' };
  });
};

module.exports = {
  createReview,
  getCourseReviews,
  getUserReviews,
  deleteReview
};
