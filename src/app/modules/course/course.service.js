const AppError = require('../../errors/AppError');
const prisma = require('../../utils/prisma');

const createCourse = async (data, providerId) => {
  // Check if course name already exists
  const existingCourse = await prisma.course.findFirst({
    where: { 
      name: data.name 
    }
  });

  if (existingCourse) {
    throw new AppError('Course with this name already exists', 400);
  }

  // Verify subSubGroup exists
  const subSubGroup = await prisma.courseSubSubGroup.findUnique({
    where: { 
      id: data.subSubGroupId 
    },
    include: {
      subGroup: {
        include: {
          group: true
        }
      }
    }
  });

  if (!subSubGroup) {
    throw new AppError('Course sub-sub group not found', 404);
  }

  const course = await prisma.course.create({
    data: {
      name: data.name,
      thumbnailUrl: data.thumbnailUrl,
      overview: data.overview,
      duration: data.duration,
      learningPoints: data.learningPoints,
      providerId,
      subSubGroupId: data.subSubGroupId,
      resources: data.resources || [],
      videoUrl: data.videoUrl,
      videoUploaded: false
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true
            }
          }
        }
      }
    },
  });
  return course;
};

const uploadCourseVideo = async (courseId, videoUrl) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { videoUrl: true }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if the same video URL already exists
  if (course.videoUrl === videoUrl) {
    throw new AppError('This video has already been uploaded to this course', 400);
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      videoUrl,
      videoUploaded: true,
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
        }
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true
            }
          }
        }
      }
    }
  });
  return updatedCourse;
};

const removeCourseVideo = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { videoUrl: true }
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (!course.videoUrl) {
    throw new AppError('No video exists for this course', 404);
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      videoUrl: null,
      videoUploaded: false,
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
        }
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true
            }
          }
        }
      }
    }
  });
  return updatedCourse;
};

const uploadCourseResources = async (courseId, resourceUrl) => {
  // First get existing resources
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: { resources: true }
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  // Check if resource already exists
  if (existingCourse.resources.includes(resourceUrl)) {
    throw new AppError('This resource has already been added to this course', 400);
  }

  // Add new resource to existing resources array
  const updatedResources = [...(existingCourse.resources || []), resourceUrl];

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      resources: updatedResources,
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
        }
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true
            }
          }
        }
      }
    }
  });
  return course;
};

// Add a new method to remove resources
const removeCourseResource = async (courseId, resourceUrl) => {
  // First get existing resources
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: { resources: true }
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  // Remove the specified resource
  const updatedResources = existingCourse.resources.filter(
    resource => resource !== resourceUrl
  );

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      resources: updatedResources,
    }
  });
  return course;
};

const getAllCourses = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = '',
  groupId = '',
  subGroupId = '',
  subSubGroupId = ''
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    AND: [
      searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { overview: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }
        : {},
      subSubGroupId ? { subSubGroupId } : {},
      subGroupId
        ? {
            subSubGroup: {
              subGroupId,
            },
          }
        : {},
      groupId
        ? {
            subSubGroup: {
              subGroup: {
                groupId,
              },
            },
          }
        : {},
    ],
  };

  const total = await prisma.course.count({
    where: whereCondition,
  });

  const courses = await prisma.course.findMany({
    where: whereCondition,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    skip,
    take: Number(limit),
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    data: courses,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getCourseById = async (id) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subSubGroup: {
        include: {
          subGroup: {
            include: {
              group: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      quiz: {
        include: {
          questions: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  return course;
};

const updateCourse = async (id, data) => {
  const course = await prisma.course.update({
    where: { id },
    data,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
  });
  return course;
};

const deleteCourse = async (id) => {
  // First check if course exists
  const courseExists = await prisma.course.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!courseExists) {
    throw new AppError('Course not found', 404);
  }

  // Use a transaction to delete all related records first
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all reviews related to the course
    await tx.review.deleteMany({
      where: { courseId: id }
    });

    // 2. Delete all certificates related to the course
    await tx.certificate.deleteMany({
      where: { courseId: id }
    });

    // 3. Delete all enrollments related to the course
    await tx.enrollment.deleteMany({
      where: { courseId: id }
    });

    // 4. Delete quiz attempts if the course has a quiz
    const quiz = await tx.quiz.findUnique({
      where: { courseId: id },
      select: { id: true }
    });

    if (quiz) {
      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { quizId: quiz.id }
      });

      // Delete quiz questions
      await tx.question.deleteMany({
        where: { quizId: quiz.id }
      });

      // Delete the quiz itself
      await tx.quiz.delete({
        where: { id: quiz.id }
      });
    }

    // 5. Finally delete the course
    const deletedCourse = await tx.course.delete({
      where: { id }
    });

    return deletedCourse;
  });
};

module.exports = {
  createCourse,
  uploadCourseVideo,
  removeCourseVideo,
  uploadCourseResources,
  removeCourseResource,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};