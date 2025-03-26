const express = require('express');
const auth = require('../../middlewares/auth');
const courseSubSubGroupController = require('./courseSubSubGroup.controller');
const router = express.Router();

// Public routes
router.get('/', courseSubSubGroupController.getAllCourseSubSubGroups);
router.get('/:id', courseSubSubGroupController.getCourseSubSubGroupById);

// Protected routes
router.use(auth('ADMIN'));
router.post('/', courseSubSubGroupController.createCourseSubSubGroup);
router.patch('/:id', courseSubSubGroupController.updateCourseSubSubGroup);
router.delete('/:id', courseSubSubGroupController.deleteCourseSubSubGroup);

module.exports = router; 