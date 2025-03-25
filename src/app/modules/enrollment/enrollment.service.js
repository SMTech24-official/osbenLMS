const prisma = require('../../utils/prisma');
const { AppError } = require('../../errors/AppError');

const enrollInCourse = async (userId, courseId) => {
  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (existingEnrollment) {
    throw new AppError('Already enrolled in this course', 400);
  }

  // Check if user has valid access
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (new Date() > user.accessEndDate) {
    throw new AppError('Your access period has expired', 403);
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          videoUrl: true,
          overview: true,
          subGroup: {
            include: {
              group: true,
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return enrollment;
};

const completeEnrollment = async (userId, courseId) => {
  const enrollment = await prisma.enrollment.update({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
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

  return enrollment;
};

const getEnrollments = async (
  userId, 
  page = 1, 
  limit = 10, 
  status,
  groupId,
  subGroupId
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    userId,
    ...(status === 'completed' ? { completed: true } : 
        status === 'ongoing' ? { completed: false } : {}),
    ...(groupId ? {
      course: {
        subGroup: {
          groupId
        }
      }
    } : {}),
    ...(subGroupId ? {
      course: {
        subGroupId
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
          subGroup: {
            include: {
              group: true,
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
  status,
  groupId,
  subGroupId
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    courseId,
    ...(status === 'completed' ? { completed: true } : 
        status === 'ongoing' ? { completed: false } : {}),
    ...(groupId ? {
      course: {
        subGroup: {
          groupId
        }
      }
    } : {}),
    ...(subGroupId ? {
      course: {
        subGroupId
      }
    } : {})
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
          studentId: true,
        },
      },
      course: {
        select: {
          id: true,
          name: true,
          subGroup: {
            include: {
              group: true,
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

const getUserCertificates = async (userId, groupId, subGroupId) => {
  const whereCondition = {
    userId,
    ...(groupId ? {
      course: {
        subGroup: {
          groupId
        }
      }
    } : {}),
    ...(subGroupId ? {
      course: {
        subGroupId
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
          subGroup: {
            include: {
              group: true,
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

module.exports = {
  enrollInCourse,
  completeEnrollment,
  getEnrollments,
  getCourseEnrollments,
  getUserCertificates,
}; 

