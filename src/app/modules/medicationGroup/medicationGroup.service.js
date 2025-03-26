const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createMedicationGroup = async (data) => {
  const result = await prisma.medicationGroup.create({
    data,
  });
  return result;
};

const getAllMedicationGroups = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = ''
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const searchCondition = searchTerm
    ? {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      }
    : {};

  const total = await prisma.medicationGroup.count({
    where: searchCondition,
  });

  const groups = await prisma.medicationGroup.findMany({
    where: searchCondition,
    include: {
      subGroups: true,
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

const getMedicationGroupById = async (id) => {
  const group = await prisma.medicationGroup.findUnique({
    where: { id },
    include: {
      subGroups: {
        include: {
          medicines: true,
        },
      },
    },
  });

  if (!group) {
    throw new AppError('Medication group not found', 404);
  }

  return group;
};

const updateMedicationGroup = async (id, data) => {
  const result = await prisma.medicationGroup.update({
    where: { id },
    data,
  });
  return result;
};

const deleteMedicationGroup = async (id) => {
  const result = await prisma.medicationGroup.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createMedicationGroup,
  getAllMedicationGroups,
  getMedicationGroupById,
  updateMedicationGroup,
  deleteMedicationGroup,
}; 