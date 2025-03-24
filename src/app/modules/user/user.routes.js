const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('./user.controller');
const router = express.Router();

// Public routes
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);

// Protected routes
router.use(auth('ADMIN'));

// GET /users?page=1&limit=10&sortBy=createdAt&sortOrder=desc&searchTerm=john
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
