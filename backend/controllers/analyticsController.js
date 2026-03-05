const { pool } = require('../models/db');

const getAnalytics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Waiting vs Completed today
    const [waiting] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status IN ('Pending', 'Confirmed')",
      [today]
    );
    const [completed] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'Completed'",
      [today]
    );
    const [cancelled] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'Cancelled'",
      [today]
    );

    // Appointments per doctor (today)
    const [perDoctor] = await pool.query(
      'SELECT doctor_name, COUNT(*) as count FROM appointments WHERE appointment_date = ? GROUP BY doctor_name',
      [today]
    );

    // Daily visits for last 7 days
    const [dailyVisits] = await pool.query(
      `SELECT DATE(appointment_date) as date, COUNT(*) as count
       FROM appointments
       WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(appointment_date)
       ORDER BY date ASC`
    );

    // Total stats
    const [totalAppointments] = await pool.query('SELECT COUNT(*) as count FROM appointments');
    const [totalPatients] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'patient'");
    const [totalDoctors] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'");
    const [totalRevenue] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'Success'");

    res.json({
      today: {
        waiting: waiting[0].count,
        completed: completed[0].count,
        cancelled: cancelled[0].count
      },
      perDoctor,
      dailyVisits,
      totals: {
        appointments: totalAppointments[0].count,
        patients: totalPatients[0].count,
        doctors: totalDoctors[0].count,
        revenue: totalRevenue[0].total
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error fetching analytics.' });
  }
};

module.exports = { getAnalytics };
