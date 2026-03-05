const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getTodaysQueue,
  getQueueStats,
  updateAppointmentStatus,
  getBookedSlots,
  getCurrentToken,
  callNextToken
} = require('../controllers/appointmentController');
const { authenticateToken, authorizeDoctor } = require('../middleware/auth');

router.post('/book', authenticateToken, bookAppointment);
router.get('/my-appointments', authenticateToken, getMyAppointments);
router.get('/queue', authenticateToken, getTodaysQueue);
router.get('/queue-stats', getQueueStats);
router.put('/status/:id', authenticateToken, authorizeDoctor, updateAppointmentStatus);
router.get('/booked-slots', authenticateToken, getBookedSlots);
router.get('/current-token', getCurrentToken);
router.post('/call-next', authenticateToken, authorizeDoctor, callNextToken);

module.exports = router;
