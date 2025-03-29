const catchAsync = require('../../utils/catchAsync');
const sendResponse = require('../../utils/sendResponse');
const enrollmentService = require('./enrollment.service');

const enrollInCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  const result = await enrollmentService.enrollInCourse(userId, courseId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Successfully enrolled in the course',
    data: result
  });
});

const completeEnrollment = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const result = await enrollmentService.completeEnrollment(req.user.id, courseId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course completed successfully',
    data: result,
  });
});

const getMyEnrollments = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    groupId, 
    subGroupId,
    subSubGroupId 
  } = req.query;
  
  const result = await enrollmentService.getEnrollments(
    req.user.id,
    page,
    limit,
    status,
    groupId,
    subGroupId,
    subSubGroupId
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Enrollments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseEnrollments = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  const result = await enrollmentService.getCourseEnrollments(
    courseId,
    page,
    limit,
    status
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course enrollments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMyCertificates = catchAsync(async (req, res) => {
  const { groupId, subGroupId, subSubGroupId } = req.query;
  const result = await enrollmentService.getUserCertificates(
    req.user.id,
    groupId,
    subGroupId,
    subSubGroupId
  );
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Certificates retrieved successfully',
    data: result,
  });
});

const checkEnrollment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  const result = await enrollmentService.checkEnrollment(userId, courseId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Enrollment status retrieved successfully',
    data: result
  });
});

module.exports = {
  enrollInCourse,
  completeEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  getMyCertificates,
  checkEnrollment
}; 