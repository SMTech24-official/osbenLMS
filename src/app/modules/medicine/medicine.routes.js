const express = require('express');
const auth = require('../../middlewares/auth');
const medicineController = require('./medicine.controller');
const router = express.Router();

router.use(auth('ADMIN', 'PROVIDER'));

router
  .route('/')
  .post(medicineController.createMedicine)
  .get(medicineController.getAllMedicines);

router
  .route('/:id')
  .get(medicineController.getMedicineById)
  .patch(medicineController.updateMedicine)
  .delete(medicineController.deleteMedicine);

module.exports = router; 