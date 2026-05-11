const express = require('express');
const mongoose = require('mongoose');

const Appointment = require('../models/ Appointment');
const Doctor = require('../models/ Doctor');
const User = require('../models/ User');
const { verifyToken } = require('../middleware/authMiddleware');
const {
    sendBookingConfirmationEmail,
    sendCancellationEmail
} = require('../utils/sendEmail');

const router = express.Router();

/**
 * BOOK APPOINTMENT
 */
router.post('/book', verifyToken, async(req, res) => {
    try {
        const { doctorId, date, timeSlot, notes } = req.body;
        const patientId = req.userId;

        if (!patientId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!doctorId || !date || !timeSlot) {
            return res.status(400).json({
                message: 'Doctor, date, and time slot are required'
            });
        }

        // ✅ validate doctorId
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid doctor ID' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // ✅ SAFE SLOT CHECK
        const slotExists = Array.isArray(doctor.availableSlots) &&
            doctor.availableSlots.some(slot =>
                slot &&
                slot.date === date &&
                Array.isArray(slot.slots) &&
                slot.slots.includes(timeSlot)
            );

        if (!slotExists) {
            return res.status(400).json({
                message: 'Selected slot is not available'
            });
        }

        // ✅ conflict check
        const conflict = await Appointment.findOne({
            doctorId,
            date,
            timeSlot,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (conflict) {
            return res.status(400).json({
                message: 'Slot already booked'
            });
        }

        // ✅ create appointment
        const newAppointment = new Appointment({
            patientId,
            doctorId,
            date,
            timeSlot,
            notes: notes || '',
            status: 'confirmed'
        });

        await newAppointment.save();

        // ✅ fetch patient safely
        const patient = await User.findById(patientId);

        // ✅ EMAIL SAFE (won’t crash)
        if (patient && patient.email) {
            try {
                await sendBookingConfirmationEmail(patient.email, {
                    patientName: patient.name,
                    doctorName: doctor.name,
                    date,
                    timeSlot,
                    appointmentId: newAppointment.appointmentId,
                    fees: doctor.fees
                });
            } catch (emailErr) {
                console.error('Email failed:', emailErr.message);
            }
        }

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: newAppointment
        });

    } catch (err) {
        console.error('BOOK ERROR:', err);
        res.status(500).json({ message: 'Server error booking appointment' });
    }
});

/**
 * GET MY APPOINTMENTS
 */
router.get('/my', verifyToken, async(req, res) => {
    try {
        const patientId = req.userId;

        if (!patientId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'name specialty fees photo')
            .sort({ date: -1 });

        res.json(appointments);

    } catch (err) {
        console.error('GET ERROR:', err);
        res.status(500).json({ message: 'Server error fetching appointments' });
    }
});

/**
 * CANCEL APPOINTMENT
 */
router.patch('/:id/cancel', verifyToken, async(req, res) => {
    try {
        const appointmentId = req.params.id;
        const patientId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }

        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name')
            .populate('patientId', 'name email');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // ✅ FIXED COMPARISON (very important)
        if (!appointment.patientId ||
            appointment.patientId._id.toString() !== patientId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Already cancelled' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // ✅ EMAIL SAFE
        if (appointment.patientId.email) {
            try {
                await sendCancellationEmail(appointment.patientId.email, {
                    patientName: appointment.patientId.name,
                    doctorName: appointment.doctorId.name,
                    appointmentId: appointment.appointmentId
                });
            } catch (emailErr) {
                console.error('Cancel email failed:', emailErr.message);
            }
        }

        res.json({
            message: 'Cancelled successfully',
            appointment
        });

    } catch (err) {
        console.error('CANCEL ERROR:', err);
        res.status(500).json({ message: 'Server error cancelling appointment' });
    }
});

module.exports = router;