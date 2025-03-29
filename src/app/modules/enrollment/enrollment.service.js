const { PrismaClient } = require('@prisma/client');
const  AppError  = require('../../errors/AppError');
const prisma = new PrismaClient();

const enrollInCourse = async (userId, courseId) => {
  // First check if user has valid access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accessEndDate: true,
      role: true,
      enrollments: {
        where: { courseId }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user has valid subscription access
  if (!user.accessEndDate || new Date() > user.accessEndDate) {
    throw new AppError('Please subscribe to access and enroll in courses', 403);
  }

  // Check if already enrolled
  if (user.enrollments.length > 0) {
    throw new AppError('You are already enrolled in this course', 400);
  }

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { 
      id: courseId
    },
    select: {
      id: true,
      name: true,
      providerId: true
    }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Prevent provider from enrolling in their own course
  if (user.role === 'PROVIDER' && course.providerId === userId) {
    throw new AppError('You cannot enroll in your own course', 400);
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      enrolledAt: new Date(),
      completed: false
    },
    include: {
      course: {
        select: {
          name: true,
          provider: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  return enrollment;
};

const completeEnrollment = async (userId, courseId) => {
  // Check if user has valid access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessEndDate: true
    }
  });

  if (!user.accessEndDate || new Date() > user.accessEndDate) {
    throw new AppError('Please subscribe to complete courses', 403);
  }

  // Check if enrollment exists
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
    include: {
      course: {
        include: {
          quiz: true
        }
      }
    }
  });

  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  if (enrollment.completed) {
    throw new AppError('Course already completed', 400);
  }

  // If course has quiz, check if user has passed it
  if (enrollment.course.quiz) {
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: enrollment.course.quiz.id,
      },
    });

    if (!quizAttempt) {
      throw new AppError('Must complete the quiz before completing the course', 400);
    }

    // Assuming passing score is 60%
    if (quizAttempt.score < 60) {
      throw new AppError('Must pass the quiz before completing the course', 400);
    }
  }

  const updatedEnrollment = await prisma.enrollment.update({
    where: {
      id: enrollment.id,
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  // Generate certificate
  await prisma.certificate.create({
    data: {
      userId,
      courseId,
    },
  });

  return updatedEnrollment;
};

const getEnrollments = async (
  userId,
  page = 1,
  limit = 10,
  status,
  groupId,
  subGroupId,
  subSubGroupId
) => {
  // Check if user has valid access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessEndDate: true,
      role: true
    }
  });

  if (!user.accessEndDate || new Date() > user.accessEndDate) {
    throw new AppError('Please subscribe to access your enrollments', 403);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    userId,
    ...(status === 'completed' ? { completed: true } : 
        status === 'ongoing' ? { completed: false } : {}),
    ...(subSubGroupId ? {
      course: {
        subSubGroupId
      }
    } : {}),
    ...(subGroupId ? {
      course: {
        subSubGroup: {
          subGroupId
        }
      }
    } : {}),
    ...(groupId ? {
      course: {
        subSubGroup: {
          subGroup: {
            groupId
          }
        }
      }
    } : {})
  };

  const total = await prisma.enrollment.count({
    where: whereCondition,
  });

  const enrollments = await prisma.enrollment.findMany({
    where: whereCondition,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          videoUrl: true,
          overview: true,
          subSubGroup: {
            include: {
              subGroup: {
                include: {
                  group: true,
                },
              },
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
          quiz: {
            include: {
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        },
      },
    },
    skip,
    take: Number(limit),
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return {
    data: enrollments,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getCourseEnrollments = async (
  courseId,
  page = 1,
  limit = 10,
  status
) => {
  // Check if user has valid access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessEndDate: true,
      role: true
    }
  });

  if (!user.accessEndDate || new Date() > user.accessEndDate) {
    throw new AppError('Please subscribe to access course information', 403);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    courseId,
    ...(status === 'completed' ? { completed: true } : 
        status === 'ongoing' ? { completed: false } : {})
  };

  const total = await prisma.enrollment.count({
    where: whereCondition,
  });

  const enrollments = await prisma.enrollment.findMany({
    where: whereCondition,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          name: true,
          subSubGroup: {
            include: {
              subGroup: {
                include: {
                  group: true,
                },
              },
            },
          },
        },
      },
    },
    skip,
    take: Number(limit),
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return {
    data: enrollments,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getUserCertificates = async (userId, groupId, subGroupId, subSubGroupId) => {
  const whereCondition = {
    userId,
    ...(subSubGroupId ? {
      course: {
        subSubGroupId
      }
    } : {}),
    ...(subGroupId ? {
      course: {
        subSubGroup: {
          subGroupId
        }
      }
    } : {}),
    ...(groupId ? {
      course: {
        subSubGroup: {
          subGroup: {
            groupId
          }
        }
      }
    } : {})
  };

  const certificates = await prisma.certificate.findMany({
    where: whereCondition,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          subSubGroup: {
            include: {
              subGroup: {
                include: {
                  group: true,
                },
              },
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      issuedAt: 'desc',
    },
  });

  return certificates;
};

// Check if a user is enrolled in a specific course
const checkEnrollment = async (userId, courseId) => {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if enrollment exists
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId
    },
    select: {
      id: true,
      enrolledAt: true,
      completed: true,
      completedAt: true,
      course: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return {
    isEnrolled: !!enrollment,
    enrollmentDetails: enrollment || null
  };
};

module.exports = {
  enrollInCourse,
  completeEnrollment,
  getEnrollments,
  getCourseEnrollments,
  getUserCertificates,
  checkEnrollment
};
