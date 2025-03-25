const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const courseSubGroupService = require('./courseSubGroup.service');

const createCourseSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubGroupService.createCourseSubGroup(req.body);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Course sub-group created successfully',
    data: result,
  });
});

const getAllCourseSubGroups = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm, groupId } = req.query;
  const result = await courseSubGroupService.getAllCourseSubGroups(
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
    message: 'Course sub-groups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseSubGroupById = catchAsync(async (req, res) => {
  const result = await courseSubGroupService.getCourseSubGroupById(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-group retrieved successfully',
    data: result,
  });
});

const updateCourseSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubGroupService.updateCourseSubGroup(req.params.id, req.body);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-group updated successfully',
    data: result,
  });
});

const deleteCourseSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubGroupService.deleteCourseSubGroup(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-group deleted successfully',
    data: result,
  });
});

module.exports = {
  createCourseSubGroup,
  getAllCourseSubGroups,
  getCourseSubGroupById,
  updateCourseSubGroup,
  deleteCourseSubGroup,
}; 