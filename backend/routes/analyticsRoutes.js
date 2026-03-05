const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticateToken, authorizeDoctor } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeDoctor, getAnalytics);

module.exports = router;
