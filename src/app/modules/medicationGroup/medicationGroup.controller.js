const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const medicationGroupService = require('./medicationGroup.service');

const createMedicationGroup = catchAsync(async (req, res) => {
  const result = await medicationGroupService.createMedicationGroup(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Medication group created successfully',
    data: result,
  });
});

const getAllMedicationGroups = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm } = req.query;
  const result = await medicationGroupService.getAllMedicationGroups(
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medication groups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMedicationGroupById = catchAsync(async (req, res) => {
  const result = await medicationGroupService.getMedicationGroupById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medication group retrieved successfully',
    data: result,
  });
});

const updateMedicationGroup = catchAsync(async (req, res) => {
  const result = await medicationGroupService.updateMedicationGroup(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medication group updated successfully',
    data: result,
  });
});

const deleteMedicationGroup = catchAsync(async (req, res) => {
  const result = await medicationGroupService.deleteMedicationGroup(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Medication group deleted successfully',
    data: result,
  });
});

module.exports = {
  createMedicationGroup,
  getAllMedicationGroups,
  getMedicationGroupById,
  updateMedicationGroup,
  deleteMedicationGroup,
}; 