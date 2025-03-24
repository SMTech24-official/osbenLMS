const express = require('express');
const auth = require('../../middlewares/auth');
const subGroupController = require('./subGroup.controller');
const router = express.Router();

router.use(auth('ADMIN', 'PROVIDER'));

router
  .route('/')
  .post(subGroupController.createSubGroup)
  .get(subGroupController.getAllSubGroups);

router
  .route('/:id')
  .get(subGroupController.getSubGroupById)
  .patch(subGroupController.updateSubGroup)
  .delete(subGroupController.deleteSubGroup);

module.exports = router; 