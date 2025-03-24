const express = require('express');
const auth = require('../../middlewares/auth');
const enrollmentController = require('./enrollment.controller');
const router = express.Router();

// Student routes
router.use(auth('USER'));
router.post('/courses/:courseId/enroll', enrollmentController.enrollInCourse);
router.patch('/courses/:courseId/complete', enrollmentController.completeEnrollment);
router.get('/my-enrollments', enrollmentController.getMyEnrollments);
router.get('/my-certificates', enrollmentController.getMyCertificates);

// Provider/Admin routes
router.get(
  '/courses/:courseId/enrollments',
  auth('ADMIN', 'PROVIDER'),
  enrollmentController.getCourseEnrollments
);

module.exports = router; 