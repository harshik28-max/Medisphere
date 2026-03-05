const { pool } = require('../models/db');
require('dotenv').config();

let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.warn('Stripe not configured. Payment features will use demo mode.');
}

const createPaymentIntent = async (req, res) => {
  try {
    const { appointment_id, amount } = req.body;
    const patient_id = req.user.id;

    if (!appointment_id || !amount) {
      return res.status(400).json({ error: 'Appointment ID and amount are required.' });
    }

    // Check if Stripe is configured with a real key
    const isStripeConfigured = process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key' &&
      stripe;

    if (isStripeConfigured) {
      // Real Stripe integration
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'inr',
        metadata: {
          appointment_id: appointment_id.toString(),
          patient_id: patient_id.toString()
        }
      });

      // Create payment record
      await pool.query(
        'INSERT INTO payments (patient_id, appointment_id, amount, payment_method, payment_status, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_id, appointment_id, amount, 'stripe', 'Pending', paymentIntent.id]
      );

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        mode: 'stripe'
      });
    } else {
      // Demo mode - simulate payment
      const demoPaymentId = 'demo_pi_' + Date.now() + '_' + Math.random().toString(36).substring(7);

      await pool.query(
        'INSERT INTO payments (patient_id, appointment_id, amount, payment_method, payment_status, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_id, appointment_id, amount, 'demo', 'Pending', demoPaymentId]
      );

      res.json({
        paymentId: demoPaymentId,
        mode: 'demo',
        message: 'Demo mode - Stripe not configured. Use the confirm endpoint to simulate payment.'
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Server error creating payment.' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { appointment_id, payment_id } = req.body;
    const patient_id = req.user.id;

    if (!appointment_id) {
      return res.status(400).json({ error: 'Appointment ID is required.' });
    }

    // Update payment status
    if (payment_id) {
      await pool.query(
        "UPDATE payments SET payment_status = 'Success' WHERE stripe_payment_id = ? AND patient_id = ?",
        [payment_id, patient_id]
      );
    } else {
      await pool.query(
        "UPDATE payments SET payment_status = 'Success' WHERE appointment_id = ? AND patient_id = ?",
        [appointment_id, patient_id]
      );
    }

    // Update appointment status
    await pool.query(
      "UPDATE appointments SET payment_status = 'Paid', status = 'Confirmed' WHERE id = ? AND patient_id = ?",
      [appointment_id, patient_id]
    );

    // Get updated appointment
    const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointment_id]);

    res.json({
      message: 'Payment confirmed! Appointment booked successfully.',
      appointment: appointment[0]
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Server error confirming payment.' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, a.doctor_name, a.department, a.appointment_date, a.time_slot, a.token_number
       FROM payments p
       JOIN appointments a ON p.appointment_id = a.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Server error fetching payment history.' });
  }
};

module.exports = { createPaymentIntent, confirmPayment, getPaymentHistory };
