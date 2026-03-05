const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, getPaymentHistory } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPayment);
router.get('/history', authenticateToken, getPaymentHistory);

module.exports = router;
