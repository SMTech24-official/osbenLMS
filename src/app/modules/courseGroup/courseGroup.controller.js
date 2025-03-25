const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const courseGroupService = require('./courseGroup.service');

const createCourseGroup = catchAsync(async (req, res) => {
  const result = await courseGroupService.createCourseGroup(req.body);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Course group created successfully',
    data: result,
  });
});

const getAllCourseGroups = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm } = req.query;
  const result = await courseGroupService.getAllCourseGroups(
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course groups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseGroupById = catchAsync(async (req, res) => {
  const result = await courseGroupService.getCourseGroupById(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course group retrieved successfully',
    data: result,
  });
});

const updateCourseGroup = catchAsync(async (req, res) => {
  const result = await courseGroupService.updateCourseGroup(req.params.id, req.body);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course group updated successfully',
    data: result,
  });
});

const deleteCourseGroup = catchAsync(async (req, res) => {
  const result = await courseGroupService.deleteCourseGroup(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course group deleted successfully',
    data: result,
  });
});

module.exports = {
  createCourseGroup,
  getAllCourseGroups,
  getCourseGroupById,
  updateCourseGroup,
  deleteCourseGroup,
}; 