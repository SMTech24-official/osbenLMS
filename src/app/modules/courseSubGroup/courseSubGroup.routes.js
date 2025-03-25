const express = require('express');
const auth = require('../../middlewares/auth');
const courseSubGroupController = require('./courseSubGroup.controller');
const router = express.Router();

// Public routes
router.get('/', courseSubGroupController.getAllCourseSubGroups);
router.get('/:id', courseSubGroupController.getCourseSubGroupById);

// Protected routes
router.use(auth('ADMIN'));
router.post('/', courseSubGroupController.createCourseSubGroup);
router.patch('/:id', courseSubGroupController.updateCourseSubGroup);
router.delete('/:id', courseSubGroupController.deleteCourseSubGroup);

module.exports = router; 