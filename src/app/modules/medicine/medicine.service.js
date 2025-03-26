const prisma = require('../../utils/prisma');
const AppError = require('../../errors/AppError');

const createMedicine = async (data) => {
  const result = await prisma.medicine.create({
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

const getAllMedicines = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = '',
  subGroupId = null
) => {
  const skip = (Number(page) - 1) * Number(limit);

  const searchCondition = {
    AND: [
      searchTerm
        ? {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {},
      subGroupId ? { subGroupId } : {},
    ],
  };

  const total = await prisma.medicine.count({
    where: searchCondition,
  });

  const medicines = await prisma.medicine.findMany({
    where: searchCondition,
    include: {
      subGroup: {
        include: {
          group: true,
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
    data: medicines,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getMedicineById = async (id) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: {
      subGroup: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  return medicine;
};

const updateMedicine = async (id, data) => {
  const result = await prisma.medicine.update({
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

const deleteMedicine = async (id) => {
  const result = await prisma.medicine.delete({
    where: { id },
  });
  return result;
};

module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
}; 