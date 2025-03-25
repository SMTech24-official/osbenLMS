const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/sendResponse');
const courseService = require('./course.service');
const { fileUpload } = require('../../utils/FileUpload');
const { AppError } = require('../../errors/AppError');

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
  if (!req.file) {
    throw new AppError('No video file provided', 400);
  }

  const { courseId } = req.params;
  
  // Check if course exists and belongs to the provider
  const course = await courseService.getCourseById(courseId);
  
  if (course.providerId !== req.user.id) {
    throw new AppError('You are not authorized to upload video for this course', 403);
  }

  const videoUrl = await fileUpload.uploadFile(req.file);
  const result = await courseService.uploadCourseVideo(courseId, videoUrl);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course video uploaded successfully',
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
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
}; 