const express = require('express');
const auth = require('../../middlewares/auth');
const enrollmentController = require('./enrollment.controller');
const router = express.Router();

// Student routes
router.use(auth('USER'));

// Enrollment routes
router.post('/courses/:courseId/enroll', enrollmentController.enrollInCourse);
router.patch('/courses/:courseId/complete', enrollmentController.completeEnrollment);
router.get('/check-enrollment/:courseId', enrollmentController.checkEnrollment);

// Get enrollments with optional filtering
router.get('/my-enrollments', enrollmentController.getMyEnrollments);
router.get('/my-certificates', enrollmentController.getMyCertificates);

// Hierarchical filtering routes
router.get('/my-enrollments/by-group/:groupId', enrollmentController.getMyEnrollments);
router.get('/my-enrollments/by-subgroup/:subGroupId', enrollmentController.getMyEnrollments);
router.get('/my-enrollments/by-sub-subgroup/:subSubGroupId', enrollmentController.getMyEnrollments);

// Provider/Admin routes for viewing course enrollments
router.get(
  '/courses/:courseId/enrollments',
  auth('ADMIN', 'PROVIDER'),
  enrollmentController.getCourseEnrollments
);

module.exports = router;