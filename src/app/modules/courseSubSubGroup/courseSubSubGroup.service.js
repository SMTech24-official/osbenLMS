const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createCourseSubSubGroup = async (data) => {

  // Verify subGroup exists
  const subGroup = await prisma.courseSubGroup.findUnique({
    where: { id: data.subGroupId },
    include: { group: true },
  });

  if (!subGroup) {
    throw new AppError('Course sub group not found', 404);
  }

  // check if subSubGroup already exists
  const existingSubSubGroup = await prisma.courseSubSubGroup.findFirst({
    where: { name: data.name },
  });

  if (existingSubSubGroup) {
    throw new AppError('Course sub-sub group already exists', 400);
  }
  const result = await prisma.courseSubSubGroup.create({
    data,
    include: {
      subGroup: {
        include: {
          group: true,
        },
      },
    },
  });
  return result;
};

const getAllCourseSubSubGroups = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = '',
  groupId = null,
  subGroupId = null
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

  const total = await prisma.courseSubSubGroup.count({
    where: whereCondition,
  });

  const subSubGroups = await prisma.courseSubSubGroup.findMany({
    where: whereCondition,
    include: {
      subGroup: {
        include: {
          group: true,
        },
      },
      _count: {
        select: {
          courses: true,
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
    data: subSubGroups,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getCourseSubSubGroupById = async (id) => {
  const subSubGroup = await prisma.courseSubSubGroup.findUnique({
    where: { id },
    include: {
      subGroup: {
        include: {
          group: true,
        },
      },
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
  });

  if (!subSubGroup) {
    throw new AppError('Course sub-sub group not found', 404);
  }

  return subSubGroup;
};

const updateCourseSubSubGroup = async (id, data) => {
  const result = await prisma.courseSubSubGroup.update({
    where: { id },
    data,
    include: {
      subGroup: {
        include: {
          group: true,
        },
      },
    },
  });
  return result;
};

const deleteCourseSubSubGroup = async (id) => {
  const result = await prisma.courseSubSubGroup.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createCourseSubSubGroup,
  getAllCourseSubSubGroups,
  getCourseSubSubGroupById,
  updateCourseSubSubGroup,
  deleteCourseSubSubGroup,
}; 