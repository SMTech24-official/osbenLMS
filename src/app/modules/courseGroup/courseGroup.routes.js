const express = require('express');
const auth = require('../../middlewares/auth');
const courseGroupController = require('./courseGroup.controller');
const router = express.Router();

// Public routes
router.get('/', courseGroupController.getAllCourseGroups);
router.get('/:id', courseGroupController.getCourseGroupById);

// Protected routes
router.use(auth('ADMIN'));
router.post('/', courseGroupController.createCourseGroup);
router.patch('/:id', courseGroupController.updateCourseGroup);
router.delete('/:id', courseGroupController.deleteCourseGroup);

module.exports = router; 