const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    specialty: {
        type: String,
        required: true,
        enum: [
            'General Physician',
            'Cardiologist',
            'Dermatologist',
            'Pediatrics',
            'Neurologist',
            'Orthopedic Surgeon',
        ],
    },
    photo: {
        type: String,
        default: 'https://via.placeholder.com/200?text=Doctor',
    },
    bio: {
        type: String,
        default: 'Experienced healthcare professional',
    },
    fees: {
        type: Number,
        required: true,
        default: 500,
    },
    availableSlots: [{
        date: String,
        slots: [String],
    }, ],
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5,
    },
    totalAppointments: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);