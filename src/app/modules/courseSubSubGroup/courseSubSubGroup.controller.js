const catchAsync = require('../../utils/catchAsync');
const  sendResponse  = require('../../utils/sendResponse');
const courseSubSubGroupService = require('./courseSubSubGroup.service');

const createCourseSubSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubSubGroupService.createCourseSubSubGroup(req.body);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Course sub-sub-group created successfully',
    data: result,
  });
});

const getAllCourseSubSubGroups = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm, groupId, subGroupId } = req.query;
  const result = await courseSubSubGroupService.getAllCourseSubSubGroups(
    page,
    limit,
    sortBy,
    sortOrder,
    searchTerm,
    groupId,
    subGroupId
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-sub-groups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseSubSubGroupById = catchAsync(async (req, res) => {
  const result = await courseSubSubGroupService.getCourseSubSubGroupById(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-sub-group retrieved successfully',
    data: result,
  });
});

const updateCourseSubSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubSubGroupService.updateCourseSubSubGroup(
    req.params.id,
    req.body
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-sub-group updated successfully',
    data: result,
  });
});

const deleteCourseSubSubGroup = catchAsync(async (req, res) => {
  const result = await courseSubSubGroupService.deleteCourseSubSubGroup(req.params.id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course sub-sub-group deleted successfully',
    data: result,
  });
});

module.exports = {
  createCourseSubSubGroup,
  getAllCourseSubSubGroups,
  getCourseSubSubGroupById,
  updateCourseSubSubGroup,
  deleteCourseSubSubGroup,
}; 