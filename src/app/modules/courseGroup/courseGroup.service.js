const prisma = require('../../utils/prisma');
const  AppError  = require('../../errors/AppError');

const createCourseGroup = async (data) => {
  // Check if group already exists with findFirst instead of findUnique
  const existingGroup = await prisma.courseGroup.findFirst({
    where: { 
      name: data.name 
    },
  });

  if (existingGroup) {
    throw new AppError('Course group with this name already exists', 400);
  }

  const result = await prisma.courseGroup.create({
    data,
    include: {
      subGroups: {
        include: {
          subSubGroups: true
        }
      }
    },
  });
  return result;
};

const getAllCourseGroups = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = ''
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = searchTerm
    ? {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      }
    : {};

  const total = await prisma.courseGroup.count({
    where: whereCondition,
  });

  const groups = await prisma.courseGroup.findMany({
    where: whereCondition,
    include: {
      subGroups: {
        include: {
          subSubGroups: {
            include: {
              _count: {
                select: {
                  courses: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          subGroups: true,
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
    data: groups,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getCourseGroupById = async (id) => {
  const group = await prisma.courseGroup.findUnique({
    where: { id },
    include: {
      subGroups: {
        include: {
          subSubGroups: {
            include: {
              courses: {
                include: {
                  provider: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    throw new AppError('Course group not found', 404);
  }

  return group;
};

const updateCourseGroup = async (id, data) => {
  const result = await prisma.courseGroup.update({
    where: { id },
    data,
  });
  return result;
};

const deleteCourseGroup = async (id) => {
  const result = await prisma.courseGroup.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createCourseGroup,
  getAllCourseGroups,
  getCourseGroupById,
  updateCourseGroup,
  deleteCourseGroup,
}; 