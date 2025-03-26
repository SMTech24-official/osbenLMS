const express = require('express');
const auth = require('../../middlewares/auth');
const subscriptionController = require('./subscription.controller');
const router = express.Router();

router.use(auth());

router.post('/create-customer', subscriptionController.createCustomer);
router.post('/attach-payment', subscriptionController.attachPaymentMethod);
router.post('/subscribe', subscriptionController.createSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.get('/status', subscriptionController.getSubscriptionStatus);

module.exports = router; 