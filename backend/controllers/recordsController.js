const { pool } = require('../models/db');

const getPatientRecords = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [records] = await pool.query(
      'SELECT * FROM patient_records WHERE patient_id = ? ORDER BY visit_date DESC',
      [patient_id]
    );

    // Get patient info
    const [patient] = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [patient_id]
    );

    res.json({
      patient: patient[0] || null,
      records
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ error: 'Server error fetching patient records.' });
  }
};

const addPatientRecord = async (req, res) => {
  try {
    const { patient_id, diagnosis, prescription, doctor_notes, visit_date } = req.body;
    const doctor_name = req.user.name;

    if (!patient_id || !diagnosis || !visit_date) {
      return res.status(400).json({ error: 'Patient ID, diagnosis, and visit date are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO patient_records (patient_id, diagnosis, prescription, doctor_notes, visit_date, doctor_name) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, diagnosis, prescription || '', doctor_notes || '', visit_date, doctor_name]
    );

    res.status(201).json({
      message: 'Patient record added successfully.',
      record: {
        id: result.insertId,
        patient_id,
        diagnosis,
        prescription,
        doctor_notes,
        visit_date,
        doctor_name
      }
    });
  } catch (error) {
    console.error('Add patient record error:', error);
    res.status(500).json({ error: 'Server error adding patient record.' });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const [patients] = await pool.query(
      "SELECT id, name, email, phone, created_at FROM users WHERE role = 'patient' ORDER BY name ASC"
    );
    res.json(patients);
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ error: 'Server error fetching patients.' });
  }
};

module.exports = { getPatientRecords, addPatientRecord, getAllPatients };
