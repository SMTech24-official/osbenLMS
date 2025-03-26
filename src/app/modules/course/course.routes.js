const express = require('express');
const auth = require('../../middlewares/auth');
const courseController = require('./course.controller');
const { upload, fileUpload } = require('../../utils/FileUpload');
const handleMulterError = require('../../middlewares/handleMulterError');
const router = express.Router();

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes
router.use(auth('ADMIN', 'PROVIDER'));

// Course group specific routes
router.get('/by-group/:groupId', courseController.getAllCourses);
router.get('/by-subgroup/:subGroupId', courseController.getAllCourses);

router.post('/', courseController.createCourse);
// router.post(
//   '/:courseId/video',
//   upload.single('video'),
//   handleMulterError,
//   courseController.uploadCourseVideo
// );
router.post(
  '/:courseId/video',
  courseController.uploadCourseVideo
);
router.delete(
  '/:courseId/video',
  courseController.removeCourseVideo
);
router.post(
  '/:courseId/resources',
  courseController.uploadCourseResources
);
router.delete(
  '/:courseId/resources',
  courseController.removeCourseResource
);
router.patch('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router; 