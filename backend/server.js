const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { initializeDatabase } = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const recordRoutes = require('./routes/recordRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const { sendWhatsAppReminders, autoCancelPending } = require('./controllers/whatsappController');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', whatsappRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Stripe publishable key endpoint
app.get('/api/config/stripe', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    isConfigured: process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key'
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/:page.html', (req, res) => {
  const filePath = path.join(__dirname, '..', 'frontend', `${req.params.page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

// Seed default doctors
const seedDoctors = async () => {
  const { pool } = require('./models/db');
  try {
    const [existing] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'");
    if (existing[0].count === 0) {
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      const doctors = [
        {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@smartq.com',
          phone: '+1234567890',
          specialization: 'Cardiologist',
          experience: 15,
          department: 'Cardiology',
          avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D9488&color=fff&size=200'
        },
        {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@smartq.com',
          phone: '+1234567891',
          specialization: 'Neurologist',
          experience: 12,
          department: 'Neurology',
          avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3B82F6&color=fff&size=200'
        },
        {
          name: 'Dr. Priya Patel',
          email: 'priya.patel@smartq.com',
          phone: '+1234567892',
          specialization: 'Dermatologist',
          experience: 10,
          department: 'Dermatology',
          avatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=8B5CF6&color=fff&size=200'
        },
        {
          name: 'Dr. James Wilson',
          email: 'james.wilson@smartq.com',
          phone: '+1234567893',
          specialization: 'Orthopedic Surgeon',
          experience: 18,
          department: 'Orthopedics',
          avatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=EF4444&color=fff&size=200'
        },
        {
          name: 'Dr. Emily Roberts',
          email: 'emily.roberts@smartq.com',
          phone: '+1234567894',
          specialization: 'Pediatrician',
          experience: 8,
          department: 'Pediatrics',
          avatar: 'https://ui-avatars.com/api/?name=Emily+Roberts&background=F59E0B&color=fff&size=200'
        },
        {
          name: 'Dr. Raj Sharma',
          email: 'raj.sharma@smartq.com',
          phone: '+1234567895',
          specialization: 'General Physician',
          experience: 20,
          department: 'General Medicine',
          avatar: 'https://ui-avatars.com/api/?name=Raj+Sharma&background=10B981&color=fff&size=200'
        }
      ];

      for (const doc of doctors) {
        await pool.query(
          'INSERT INTO users (name, email, phone, password, role, specialization, experience, department, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [doc.name, doc.email, doc.phone, hashedPassword, 'doctor', doc.specialization, doc.experience, doc.department, doc.avatar]
        );
      }
      console.log('🩺 Default doctors seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding doctors:', error.message);
  }
};

// Initialize and start
const startServer = async () => {
  try {
    await initializeDatabase();
    await seedDoctors();

    // WhatsApp reminders at 7:00 AM IST (1:30 AM UTC)
    cron.schedule('30 1 * * *', () => {
      console.log('⏰ Running 7:00 AM IST WhatsApp reminders...');
      sendWhatsAppReminders();
    });

    // Auto-cancel pending at 9:00 AM IST (3:30 AM UTC)
    cron.schedule('30 3 * * *', () => {
      console.log('⏰ Running 9:00 AM IST auto-cancel...');
      autoCancelPending();
    });

    app.listen(PORT, () => {
      console.log(`🚀 SmartQ Server running on http://localhost:${PORT}`);
      console.log(`📋 Frontend: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
