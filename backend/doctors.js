const express = require('express');
const Doctor = require('../models/Doctor');

const router = express.Router();

/**
 * GET /api/doctors
 */
router.get('/', async(req, res) => {
    try {
        const { specialty } = req.query;
        let query = {};

        if (specialty) {
            query.specialty = specialty;
        }

        const doctors = await Doctor.find(query);
        res.json(doctors);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ message: 'Server error fetching doctors' });
    }
});

/**
 * GET /api/doctors/:id
 */
router.get('/:id', async(req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching doctor details' });
    }
});

/**
 * GET /api/doctors/:id/slots
 */
router.get('/:id/slots', async(req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('availableSlots');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const today = new Date().toISOString().split('T')[0];
        const futureSlots = doctor.availableSlots.filter((slot) => slot.date >= today);

        res.json({
            doctorId: doctor._id,
            availableSlots: futureSlots,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching slots' });
    }
});

module.exports = router;