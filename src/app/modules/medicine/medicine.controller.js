const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const medicineService = require('./medicine.service');

const createMedicine = catchAsync(async (req, res) => {
  const result = await medicineService.createMedicine(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Medicine created successfully',
    data: result,
  });
});

const getAllMedicines = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm, subGroupId } = req.query;
  const result = await medicineService.getAllMedicines(
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm,
    subGroupId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medicines retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMedicineById = catchAsync(async (req, res) => {
  const result = await medicineService.getMedicineById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medicine retrieved successfully',
    data: result,
  });
});

const updateMedicine = catchAsync(async (req, res) => {
  const result = await medicineService.updateMedicine(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medicine updated successfully',
    data: result,
  });
});

const deleteMedicine = catchAsync(async (req, res) => {
  const result = await medicineService.deleteMedicine(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medicine deleted successfully',
    data: result,
  });
});

module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
}; 