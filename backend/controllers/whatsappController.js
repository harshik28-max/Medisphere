const { pool } = require('../models/db');
require('dotenv').config();

let twilioClient;
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  console.warn('Twilio not configured. WhatsApp features disabled.');
}

const sendWhatsAppReminders = async () => {
  try {
    if (!twilioClient) {
      console.log('📱 WhatsApp reminders skipped - Twilio not configured.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const [appointments] = await pool.query(
      `SELECT a.*, u.phone FROM appointments a
       JOIN users u ON a.patient_id = u.id
       WHERE a.appointment_date = ? AND a.status = 'Pending' AND a.payment_status = 'Paid'`,
      [today]
    );

    for (const appt of appointments) {
      if (appt.phone) {
        const message = `Hello ${appt.patient_name}, your SmartQ Token #${appt.token_number} for ${appt.doctor_name} is scheduled today. Reply YES to confirm or NO to cancel.`;

        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${appt.phone}`,
          body: message
        });

        console.log(`📱 WhatsApp sent to ${appt.patient_name}`);
      }
    }
  } catch (error) {
    console.error('WhatsApp reminder error:', error);
  }
};

const autoCancelPending = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      "UPDATE appointments SET status = 'Cancelled' WHERE appointment_date = ? AND status = 'Pending' AND payment_status = 'Paid'",
      [today]
    );
    console.log(`🚫 Auto-cancelled ${result.affectedRows} pending appointments at 9:00 AM IST.`);
  } catch (error) {
    console.error('Auto-cancel error:', error);
  }
};

const handleWhatsAppReply = async (req, res) => {
  try {
    const { From, Body } = req.body;
    const reply = Body ? Body.trim().toUpperCase() : '';
    const phone = From ? From.replace('whatsapp:', '') : '';

    if (!phone) {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find patient by phone
    const [users] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const patient_id = users[0].id;

    if (reply === 'YES') {
      await pool.query(
        "UPDATE appointments SET status = 'Confirmed' WHERE patient_id = ? AND appointment_date = ? AND status = 'Pending'",
        [patient_id, today]
      );
      res.json({ message: 'Appointment confirmed.' });
    } else if (reply === 'NO') {
      await pool.query(
        "UPDATE appointments SET status = 'Cancelled' WHERE patient_id = ? AND appointment_date = ? AND status = 'Pending'",
        [patient_id, today]
      );
      res.json({ message: 'Appointment cancelled.' });
    } else {
      res.json({ message: 'Reply YES to confirm or NO to cancel.' });
    }
  } catch (error) {
    console.error('WhatsApp reply error:', error);
    res.status(500).json({ error: 'Server error handling reply.' });
  }
};

module.exports = { sendWhatsAppReminders, autoCancelPending, handleWhatsAppReply };
