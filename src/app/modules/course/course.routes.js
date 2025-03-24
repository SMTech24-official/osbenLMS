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
router.post('/', courseController.createCourse);
router.post(
  '/:courseId/video',
  upload.single('video'),
  handleMulterError,
  courseController.uploadCourseVideo
);
router.patch('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router; 