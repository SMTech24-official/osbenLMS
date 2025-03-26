const catchAsync = require('../../utils/catchAsync');
const  sendResponse = require('../../utils/sendResponse');
const courseService = require('./course.service');
const { fileUpload } = require('../../utils/FileUpload');
const AppError = require('../../errors/AppError');


const createCourse = catchAsync(async (req, res) => {
  const result = await courseService.createCourse(req.body, req.user.id);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

const uploadCourseVideo = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { videoUrl } = req.body;

  if (!videoUrl) {
    throw new AppError('Video URL is required', 400);
  }

  // Check if course exists and belongs to the provider
  const course = await courseService.getCourseById(courseId);
  
  if (course.providerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to modify this course', 403);
  }

  const result = await courseService.uploadCourseVideo(courseId, videoUrl);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course video uploaded successfully',
    data: result,
  });
});

const removeCourseVideo = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  // Check if course exists and belongs to the provider
  const course = await courseService.getCourseById(courseId);
  
  if (course.providerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to modify this course', 403);
  }

  const result = await courseService.removeCourseVideo(courseId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course video removed successfully',
    data: result,
  });
});

const uploadCourseResources = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { resourceUrl } = req.body;

  // Validate resourceUrl
  if (!resourceUrl) {
    throw new AppError('Resource URL is required', 400);
  }

  // Check if course exists and belongs to the provider
  const course = await courseService.getCourseById(courseId);
  
  if (course.providerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to modify this course', 403);
  }

  const result = await courseService.uploadCourseResources(courseId, resourceUrl);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course resource added successfully',
    data: result,
  });
});

const removeCourseResource = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { resourceUrl } = req.body;

  if (!resourceUrl) {
    throw new AppError('Resource URL is required', 400);
  }

  // Check if course exists and belongs to the provider
  const course = await courseService.getCourseById(courseId);
  
  if (course.providerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to modify this course', 403);
  }

  const result = await courseService.removeCourseResource(courseId, resourceUrl);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course resource removed successfully',
    data: result,
  });
});

const getAllCourses = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, searchTerm, groupId, subGroupId } = req.query;
  const result = await courseService.getAllCourses(
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
    message: 'Courses retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseById = catchAsync(async (req, res) => {
  const result = await courseService.getCourseById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course retrieved successfully',
    data: result,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const result = await courseService.updateCourse(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

const deleteCourse = catchAsync(async (req, res) => {
  const result = await courseService.deleteCourse(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course deleted successfully',
    data: result,
  });
});

module.exports = {
  createCourse,
  uploadCourseVideo,
  removeCourseVideo,
  uploadCourseResources,
  removeCourseResource,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
}; 