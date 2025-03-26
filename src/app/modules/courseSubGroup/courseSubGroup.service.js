const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createCourseSubGroup = async (data) => {
  const existingSubGroup = await prisma.courseSubGroup.findFirst({
    where: { name: data.name },
  });

  if (existingSubGroup) {
    throw new AppError('Course sub-group already exists', 400);
  }
  const result = await prisma.courseSubGroup.create({
    data,
    include: {
      group: true,
      subSubGroups: true,
    },
  });
  return result;
};

const getAllCourseSubGroups = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = '',
  groupId = null
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition = {
    AND: [
      searchTerm
        ? {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          }
        : {},
      groupId ? { groupId } : {},
    ],
  };

  const total = await prisma.courseSubGroup.count({
    where: whereCondition,
  });

  const subGroups = await prisma.courseSubGroup.findMany({
    where: whereCondition,
    include: {
      group: true,
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
    skip,
    take: Number(limit),
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    data: subGroups,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getCourseSubGroupById = async (id) => {
  const subGroup = await prisma.courseSubGroup.findUnique({
    where: { id },
    include: {
      group: true,
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
  });

  if (!subGroup) {
    throw new AppError('Course sub group not found', 404);
  }

  return subGroup;
};

const updateCourseSubGroup = async (id, data) => {
  const result = await prisma.courseSubGroup.update({
    where: { id },
    data,
    include: {
      group: true,
    },
  });
  return result;
};

const deleteCourseSubGroup = async (id) => {
  const result = await prisma.courseSubGroup.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createCourseSubGroup,
  getAllCourseSubGroups,
  getCourseSubGroupById,
  updateCourseSubGroup,
  deleteCourseSubGroup,
}; 