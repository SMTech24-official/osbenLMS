const prisma = require('../../utils/prisma');
const { AppError } = require('../../errors/AppError');

const createSubGroup = async (data) => {
  const result = await prisma.subGroup.create({
    data,
    include: {
      group: true,
    },
  });
  return result;
};

const getAllSubGroups = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = '',
  groupId = null
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const searchCondition = {
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

  const total = await prisma.subGroup.count({
    where: searchCondition,
  });

  const subGroups = await prisma.subGroup.findMany({
    where: searchCondition,
    include: {
      group: true,
      medicines: true,
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

const getSubGroupById = async (id) => {
  const subGroup = await prisma.subGroup.findUnique({
    where: { id },
    include: {
      group: true,
      medicines: true,
    },
  });

  if (!subGroup) {
    throw new AppError('Sub group not found', 404);
  }

  return subGroup;
};

const updateSubGroup = async (id, data) => {
  const result = await prisma.subGroup.update({
    where: { id },
    data,
    include: {
      group: true,
    },
  });
  return result;
};

const deleteSubGroup = async (id) => {
  const result = await prisma.subGroup.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createSubGroup,
  getAllSubGroups,
  getSubGroupById,
  updateSubGroup,
  deleteSubGroup,
}; 