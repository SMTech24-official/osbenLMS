const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const subGroupService = require('./subGroup.service');

const createSubGroup = catchAsync(async (req, res) => {
  const result = await subGroupService.createSubGroup(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Sub group created successfully',
    data: result,
  });
});

const getAllSubGroups = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm, groupId } = req.query;
  const result = await subGroupService.getAllSubGroups(
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm,
    groupId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sub groups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSubGroupById = catchAsync(async (req, res) => {
  const result = await subGroupService.getSubGroupById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sub group retrieved successfully',
    data: result,
  });
});

const updateSubGroup = catchAsync(async (req, res) => {
  const result = await subGroupService.updateSubGroup(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sub group updated successfully',
    data: result,
  });
});

const deleteSubGroup = catchAsync(async (req, res) => {
  const result = await subGroupService.deleteSubGroup(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sub group deleted successfully',
    data: result,
  });
});

module.exports = {
  createSubGroup,
  getAllSubGroups,
  getSubGroupById,
  updateSubGroup,
  deleteSubGroup,
}; 