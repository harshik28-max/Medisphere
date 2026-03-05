# SmartQ – Smart Hospital Queue & Appointment System

A complete full-stack web application for hospital queue management and appointment booking.

## Features

- **Patient Registration & Login** – Secure authentication with bcrypt + JWT
- **Doctor Dashboard** – Queue management, analytics, patient records
- **Appointment Booking** – Select doctor, date, time slot with sequential token generation
- **Payment Integration** – Stripe (test mode) with demo fallback
- **Live Queue Display** – Real-time queue stats updated every 5 seconds
- **Token Calling System** – Voice announcement using SpeechSynthesis API
- **Medical Records** – Doctors can view and add patient records
- **Analytics** – Chart.js powered charts (Doughnut, Bar, Line)
- **WhatsApp Automation** – Twilio + node-cron for appointment reminders
- **Dark/Light Theme** – Toggle between themes
- **Responsive Design** – Glassmorphism cards, gradients, smooth animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | bcrypt, jsonwebtoken |
| Payments | Stripe (test mode) |
| Charts | Chart.js |
| Automation | node-cron, Twilio |

## Project Structure

```
smartq/
├── frontend/
│   ├── index.html          # Home page
│   ├── register.html       # Patient registration
│   ├── patient-login.html  # Patient login
│   ├── doctor-login.html   # Doctor login
│   ├── booking.html        # Book appointment
│   ├── payment.html        # Payment page
│   ├── dashboard.html      # Doctor dashboard
│   ├── records.html        # Patient records view
│   ├── style.css           # All styles
│   └── script.js           # All JavaScript
├── backend/
│   ├── server.js           # Express server entry
│   ├── models/
│   │   └── db.js           # MySQL connection & schema
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── paymentController.js
│   │   ├── recordsController.js
│   │   ├── analyticsController.js
│   │   └── whatsappController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── recordRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── whatsappRoutes.js
│   ├── package.json
│   ├── .env.example
│   └── .env
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- MySQL Server (v8+)

### 1. Clone the repository

```bash
git clone <repo-url>
cd smartq
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your MySQL credentials and optionally Stripe/Twilio keys.

### 3. Install dependencies

```bash
cd backend
npm install
```

### 4. Start MySQL

Make sure MySQL is running. The app will automatically:
- Create the `smartq_db` database
- Create all required tables
- Seed 6 default doctors

### 5. Run the server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 6. Open the app

Visit [http://localhost:3000](http://localhost:3000)

## Default Doctor Credentials

All seeded doctors use password: `doctor123`

| Doctor | Email |
|--------|-------|
| Dr. Sarah Johnson | sarah.johnson@smartq.com |
| Dr. Michael Chen | michael.chen@smartq.com |
| Dr. Priya Patel | priya.patel@smartq.com |
| Dr. James Wilson | james.wilson@smartq.com |
| Dr. Emily Roberts | emily.roberts@smartq.com |
| Dr. Raj Sharma | raj.sharma@smartq.com |

## Database Tables

- **users** – Patients and doctors
- **appointments** – Booking records with token numbers
- **patient_records** – Medical records per patient
- **payments** – Payment transactions

## Payment

The app supports Stripe in test mode. If Stripe keys are not configured, it falls back to a demo payment mode that simulates successful payments.

## WhatsApp Automation

Configure Twilio credentials in `.env` to enable:
- 7:00 AM IST – WhatsApp reminders to patients
- 9:00 AM IST – Auto-cancel unconfirmed appointments
- Webhook at `POST /api/whatsapp-reply` for YES/NO replies
