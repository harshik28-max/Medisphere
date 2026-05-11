const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send booking confirmation email
 */
const sendBookingConfirmationEmail = async(patientEmail, bookingDetails) => {
    const { patientName, doctorName, date, timeSlot, appointmentId, fees } = bookingDetails;

    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">✓ Appointment Confirmed</h2>
      <p style="color: #666; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
      
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3 style="color: #4CAF50; margin-top: 0;">Booking Details</h3>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${timeSlot}</p>
        <p><strong>Appointment ID:</strong> ${appointmentId}</p>
        <p><strong>Consultation Fees:</strong> ₹${fees}</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Please arrive 10 minutes before your appointment time. You can cancel or reschedule your appointment from your dashboard if needed.
      </p>

      <p style="color: #666;">Best regards,<br/><strong>HealthConnect Team</strong></p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        HealthConnect - Your Trusted Healthcare Partner | Visakhapatnam, Andhra Pradesh
      </p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: patientEmail,
            subject: `Appointment Confirmed - HealthConnect (APT ID: ${appointmentId})`,
            html: htmlTemplate,
        });
        console.log(`✓ Confirmation email sent to ${patientEmail}`);
        return true;
    } catch (err) {
        console.error('✗ Error sending email:', err);
        return false;
    }
};

/**
 * Send appointment cancellation email
 */
const sendCancellationEmail = async(patientEmail, cancellationDetails) => {
    const { patientName, doctorName, appointmentId } = cancellationDetails;

    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <h2 style="color: #d32f2f; text-align: center;">Appointment Cancelled</h2>
      <p style="color: #666; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
      
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
        <p>Your appointment with <strong>${doctorName}</strong> (ID: ${appointmentId}) has been cancelled.</p>
        <p>You can book another appointment from the HealthConnect dashboard anytime.</p>
      </div>

      <p style="color: #666;">Best regards,<br/><strong>HealthConnect Team</strong></p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: patientEmail,
            subject: `Appointment Cancelled - HealthConnect`,
            html: htmlTemplate,
        });
        console.log(`✓ Cancellation email sent to ${patientEmail}`);
        return true;
    } catch (err) {
        console.error('✗ Error sending cancellation email:', err);
        return false;
    }
};

module.exports = { sendBookingConfirmationEmail, sendCancellationEmail };