const prisma = require('../../utils/prisma');
const { AppError } = require('../../errors/AppError');

const createCourse = async (data, providerId) => {
  // Verify subgroup exists
  const subGroup = await prisma.courseSubGroup.findUnique({
    where: { id: data.subGroupId },
  });

  if (!subGroup) {
    throw new AppError('Course sub group not found', 404);
  }

  const course = await prisma.course.create({
    data: {
      ...data,
      providerId,
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subGroup: {
        include: {
          group: true,
        },
      },
    },
  });
  return course;
};

const uploadCourseVideo = async (courseId, videoUrl) => {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      videoUrl,
      videoUploaded: true,
    },
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
  subGroupId = ''
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
      subGroupId ? { subGroupId } : {},
      groupId
        ? {
            subGroup: {
              groupId,
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
      subGroup: {
        include: {
          group: true,
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
      subGroup: {
        include: {
          group: true,
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
    },
  });
  return course;
};

const deleteCourse = async (id) => {
  const course = await prisma.course.delete({
    where: { id },
  });
  return course;
};

module.exports = {
  createCourse,
  uploadCourseVideo,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
}; 