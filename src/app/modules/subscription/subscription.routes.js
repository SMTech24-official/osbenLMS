const express = require('express');
const auth = require('../../middlewares/auth');
const subscriptionController = require('./subscription.controller');
const router = express.Router();

router.get('/price-ids', subscriptionController.getPriceIdsByProductId);
router.use(auth());

// User subscription routes
router.post('/create-customer', subscriptionController.createCustomer);
router.post('/attach-payment', subscriptionController.attachPaymentMethod);
router.post('/subscribe', subscriptionController.createSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.get('/my-details', subscriptionController.getUserSubscriptionDetails);

// Admin routes - require ADMIN role
router.get('/subscribers', auth('ADMIN'), subscriptionController.getAllSubscribers);

module.exports = router;