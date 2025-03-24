const express = require('express');
const auth = require('../../middlewares/auth');
const medicationGroupController = require('./medicationGroup.controller');
const router = express.Router();

router.use(auth('ADMIN', 'PROVIDER'));

router
  .route('/')
  .post(medicationGroupController.createMedicationGroup)
  .get(medicationGroupController.getAllMedicationGroups);

router
  .route('/:id')
  .get(medicationGroupController.getMedicationGroupById)
  .patch(medicationGroupController.updateMedicationGroup)
  .delete(medicationGroupController.deleteMedicationGroup);

module.exports = router; 