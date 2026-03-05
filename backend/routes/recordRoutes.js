const express = require('express');
const router = express.Router();
const { getPatientRecords, addPatientRecord, getAllPatients } = require('../controllers/recordsController');
const { authenticateToken, authorizeDoctor } = require('../middleware/auth');

router.get('/patient/:patient_id', authenticateToken, getPatientRecords);
router.post('/add', authenticateToken, authorizeDoctor, addPatientRecord);
router.get('/patients', authenticateToken, authorizeDoctor, getAllPatients);

module.exports = router;
