const express = require('express');
const router = express.Router();
const { register, patientLogin, doctorLogin, getDoctors, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/patient-login', patientLogin);
router.post('/doctor-login', doctorLogin);
router.get('/doctors', getDoctors);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
