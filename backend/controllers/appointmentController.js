const { pool } = require('../models/db');

const bookAppointment = async (req, res) => {
  try {
    const { doctor_name, doctor_id, department, appointment_date, time_slot } = req.body;
    const patient_id = req.user.id;
    const patient_name = req.user.name;

    if (!doctor_name || !department || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Generate sequential token number per doctor per day
    const [tokenResult] = await pool.query(
      'SELECT MAX(token_number) as max_token FROM appointments WHERE doctor_name = ? AND appointment_date = ?',
      [doctor_name, appointment_date]
    );
    const token_number = (tokenResult[0].max_token || 0) + 1;

    // Check for duplicate booking
    const [existingBooking] = await pool.query(
      'SELECT id FROM appointments WHERE patient_id = ? AND doctor_name = ? AND appointment_date = ? AND status != ?',
      [patient_id, doctor_name, appointment_date, 'Cancelled']
    );
    if (existingBooking.length > 0) {
      return res.status(409).json({ error: 'You already have an appointment with this doctor on this date.' });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, patient_name, doctor_name, doctor_id, department, appointment_date, time_slot, token_number, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending')`,
      [patient_id, patient_name, doctor_name, doctor_id || null, department, appointment_date, time_slot, token_number]
    );

    res.status(201).json({
      message: 'Appointment created. Proceed to payment.',
      appointment: {
        id: result.insertId,
        patient_name,
        doctor_name,
        department,
        appointment_date,
        time_slot,
        token_number,
        payment_status: 'Pending',
        status: 'Pending'
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Server error booking appointment.' });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const [appointments] = await pool.query(
      'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC, token_number ASC',
      [req.user.id]
    );
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error fetching appointments.' });
  }
};

const getTodaysQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let query = 'SELECT * FROM appointments WHERE appointment_date = ?';
    const params = [today];

    // If doctor, only show their queue
    if (req.user && req.user.role === 'doctor') {
      query += ' AND doctor_name = ?';
      params.push(req.user.name);
    }

    query += ' ORDER BY token_number ASC';

    const [appointments] = await pool.query(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Server error fetching queue.' });
  }
};

const getQueueStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
      [today]
    );
    const [waiting] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status IN ('Pending', 'Confirmed')",
      [today]
    );
    const [completed] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'Completed'",
      [today]
    );

    res.json({
      total: total[0].count,
      waiting: waiting[0].count,
      completed: completed[0].count
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Server error fetching queue stats.' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: `Appointment status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating appointment.' });
  }
};

const getBookedSlots = async (req, res) => {
  try {
    const { doctor_name, date } = req.query;
    if (!doctor_name || !date) {
      return res.status(400).json({ error: 'Doctor name and date are required.' });
    }

    const [slots] = await pool.query(
      "SELECT time_slot FROM appointments WHERE doctor_name = ? AND appointment_date = ? AND status != 'Cancelled'",
      [doctor_name, date]
    );

    res.json(slots.map(s => s.time_slot));
  } catch (error) {
    console.error('Get booked slots error:', error);
    res.status(500).json({ error: 'Server error fetching booked slots.' });
  }
};

const getCurrentToken = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let query = "SELECT token_number, patient_name FROM appointments WHERE appointment_date = ? AND status = 'Confirmed' ORDER BY token_number ASC LIMIT 1";
    const params = [today];

    const [result] = await pool.query(query, params);
    if (result.length === 0) {
      return res.json({ current_token: 0, patient_name: null });
    }

    res.json({
      current_token: result[0].token_number,
      patient_name: result[0].patient_name
    });
  } catch (error) {
    console.error('Get current token error:', error);
    res.status(500).json({ error: 'Server error fetching current token.' });
  }
};

const callNextToken = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doctorName = req.user.name;

    // Find the next confirmed appointment
    const [next] = await pool.query(
      "SELECT * FROM appointments WHERE appointment_date = ? AND doctor_name = ? AND status = 'Confirmed' ORDER BY token_number ASC LIMIT 1",
      [today, doctorName]
    );

    if (next.length === 0) {
      // Try pending appointments
      const [pending] = await pool.query(
        "SELECT * FROM appointments WHERE appointment_date = ? AND doctor_name = ? AND status = 'Pending' AND payment_status = 'Paid' ORDER BY token_number ASC LIMIT 1",
        [today, doctorName]
      );
      if (pending.length === 0) {
        return res.json({ message: 'No more tokens in queue.', token: null });
      }

      // Update to confirmed, then mark as current
      await pool.query("UPDATE appointments SET status = 'Confirmed' WHERE id = ?", [pending[0].id]);
      return res.json({
        message: `Token #${pending[0].token_number} called.`,
        token: pending[0]
      });
    }

    res.json({
      message: `Token #${next[0].token_number} called.`,
      token: next[0]
    });
  } catch (error) {
    console.error('Call next token error:', error);
    res.status(500).json({ error: 'Server error calling next token.' });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getTodaysQueue,
  getQueueStats,
  updateAppointmentStatus,
  getBookedSlots,
  getCurrentToken,
  callNextToken
};
