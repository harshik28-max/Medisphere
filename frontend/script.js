// ===== SmartQ - Smart Hospital Queue & Appointment System =====
// ===== Global Configuration =====
const API_BASE = window.location.origin + '/api';
let currentUser = null;
let authToken = null;

// ===== Initialization =====
function initApp() {
  loadTheme();
  startClock();
  checkAuth();
}

// ===== Theme Toggle =====
function loadTheme() {
  const theme = localStorage.getItem('smartq-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('smartq-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const toggleBtns = document.querySelectorAll('.theme-toggle i');
  toggleBtns.forEach(icon => {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  });
}

// ===== Real-time Clock =====
function startClock() {
  const clockEl = document.getElementById('real-time-clock');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    clockEl.textContent = now.toLocaleString('en-IN', options);
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ===== Authentication =====
function checkAuth() {
  authToken = localStorage.getItem('smartq-token');
  const userData = localStorage.getItem('smartq-user');
  if (authToken && userData) {
    currentUser = JSON.parse(userData);
    updateNavForUser();
  }
}

function updateNavForUser() {
  const navAuth = document.getElementById('nav-auth');
  const navUser = document.getElementById('nav-user');
  const userGreeting = document.getElementById('user-greeting');

  if (currentUser) {
    if (navAuth) navAuth.classList.add('hidden');
    if (navUser) {
      navUser.classList.remove('hidden');
      if (userGreeting) {
        userGreeting.textContent = 'Hi, ' + currentUser.name.split(' ')[0];
      }
    }
  }
}

function logout() {
  localStorage.removeItem('smartq-token');
  localStorage.removeItem('smartq-user');
  currentUser = null;
  authToken = null;
  window.location.href = '/';
}

function requireAuth(role) {
  if (!authToken || !currentUser) {
    showToast('Please login to continue.', 'error');
    setTimeout(() => {
      window.location.href = role === 'doctor' ? '/doctor-login.html' : '/patient-login.html';
    }, 1000);
    return false;
  }
  if (role && currentUser.role !== role) {
    showToast('Access denied.', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    return false;
  }
  return true;
}

// ===== API Helper =====
async function apiRequest(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };

  if (authToken) {
    config.headers['Authorization'] = 'Bearer ' + authToken;
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ===== Loading Spinner =====
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<i class="' + icons[type] + '"></i><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== Password Toggle =====
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const btn = field.parentElement.querySelector('.password-toggle i');
  if (field.type === 'password') {
    field.type = 'text';
    btn.className = 'fas fa-eye-slash';
  } else {
    field.type = 'password';
    btn.className = 'fas fa-eye';
  }
}

// ===== Modal =====
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// ===== HOME PAGE =====
function initHomePage() {
  initApp();
  loadDoctors();
  loadQueueStats();
  setInterval(loadQueueStats, 5000);

  // Mobile menu
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.querySelector('.nav').classList.toggle('active');
    });
  }
}

async function loadDoctors() {
  try {
    const doctors = await apiRequest('/auth/doctors');
    const grid = document.getElementById('doctors-grid');
    if (!grid) return;

    if (doctors.length === 0) {
      grid.innerHTML = '<p class="empty-state">No doctors available.</p>';
      return;
    }

    grid.innerHTML = doctors.map(doc => {
      const avatarUrl = doc.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doc.name) + '&background=0D9488&color=fff&size=200';
      return '<div class="doctor-card" onclick="selectDoctor(\'' + encodeURIComponent(JSON.stringify(doc)) + '\')">' +
        '<div class="doctor-avatar"><img src="' + avatarUrl + '" alt="' + doc.name + '"></div>' +
        '<div class="doctor-info">' +
        '<div class="doctor-name">' + doc.name + '</div>' +
        '<div class="doctor-specialization">' + doc.specialization + '</div>' +
        '<div class="doctor-experience"><i class="fas fa-briefcase"></i> ' + doc.experience + ' years experience</div>' +
        '<span class="doctor-department">' + doc.department + '</span>' +
        '</div></div>';
    }).join('');

    // Update stat
    const statDoctors = document.getElementById('stat-doctors');
    if (statDoctors) statDoctors.textContent = doctors.length + '+';
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

function selectDoctor(encodedDoc) {
  const doc = JSON.parse(decodeURIComponent(encodedDoc));
  // Store selected doctor and redirect to booking
  localStorage.setItem('smartq-selected-doctor', JSON.stringify(doc));
  window.location.href = '/booking.html';
}

async function loadQueueStats() {
  try {
    const stats = await apiRequest('/appointments/queue-stats');
    const totalEl = document.getElementById('total-patients');
    const waitingEl = document.getElementById('waiting-patients');
    const completedEl = document.getElementById('completed-patients');

    if (totalEl) animateNumber(totalEl, parseInt(totalEl.textContent) || 0, stats.total);
    if (waitingEl) animateNumber(waitingEl, parseInt(waitingEl.textContent) || 0, stats.waiting);
    if (completedEl) animateNumber(completedEl, parseInt(completedEl.textContent) || 0, stats.completed);
  } catch (error) {
    console.error('Error loading queue stats:', error);
  }
}

function animateNumber(element, start, end) {
  if (start === end) return;
  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    element.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ===== REGISTER PAGE =====
function initRegisterPage() {
  initApp();
  if (currentUser) {
    window.location.href = currentUser.role === 'doctor' ? '/dashboard.html' : '/booking.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', handleRegister);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  showLoading();
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, phone, password }
    });

    localStorage.setItem('smartq-token', data.token);
    localStorage.setItem('smartq-user', JSON.stringify(data.user));
    showToast('Registration successful! Welcome to SmartQ.', 'success');
    setTimeout(() => {
      window.location.href = '/booking.html';
    }, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ===== PATIENT LOGIN PAGE =====
function initPatientLoginPage() {
  initApp();
  if (currentUser && currentUser.role === 'patient') {
    window.location.href = '/booking.html';
    return;
  }

  const form = document.getElementById('patient-login-form');
  if (form) {
    form.addEventListener('submit', handlePatientLogin);
  }
}

async function handlePatientLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  showLoading();
  try {
    const data = await apiRequest('/auth/patient-login', {
      method: 'POST',
      body: { email, password }
    });

    localStorage.setItem('smartq-token', data.token);
    localStorage.setItem('smartq-user', JSON.stringify(data.user));
    showToast('Login successful!', 'success');
    setTimeout(() => {
      window.location.href = '/booking.html';
    }, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ===== DOCTOR LOGIN PAGE =====
function initDoctorLoginPage() {
  initApp();
  if (currentUser && currentUser.role === 'doctor') {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('doctor-login-form');
  if (form) {
    form.addEventListener('submit', handleDoctorLogin);
  }
}

async function handleDoctorLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  showLoading();
  try {
    const data = await apiRequest('/auth/doctor-login', {
      method: 'POST',
      body: { email, password }
    });

    localStorage.setItem('smartq-token', data.token);
    localStorage.setItem('smartq-user', JSON.stringify(data.user));
    showToast('Doctor login successful!', 'success');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ===== BOOKING PAGE =====
let selectedTimeSlot = null;
let doctorsList = [];

function initBookingPage() {
  initApp();
  if (!requireAuth('patient')) return;
  updateNavForUser();
  loadDoctorsForBooking();
  loadMyAppointments();
  setupBookingForm();

  // Set min date to today
  const dateInput = document.getElementById('appointment-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
}

async function loadDoctorsForBooking() {
  try {
    doctorsList = await apiRequest('/auth/doctors');
    const select = document.getElementById('doctor');
    if (!select) return;

    doctorsList.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.name;
      option.textContent = doc.name + ' - ' + doc.specialization;
      option.dataset.department = doc.department;
      option.dataset.doctorId = doc.id;
      select.appendChild(option);
    });

    // Check if a doctor was pre-selected from home page
    const selectedDoc = localStorage.getItem('smartq-selected-doctor');
    if (selectedDoc) {
      const doc = JSON.parse(selectedDoc);
      select.value = doc.name;
      document.getElementById('department').value = doc.department;
      localStorage.removeItem('smartq-selected-doctor');
      generateTimeSlots();
    }

    select.addEventListener('change', function () {
      const selectedOption = this.options[this.selectedIndex];
      document.getElementById('department').value = selectedOption.dataset.department || '';
      generateTimeSlots();
    });
  } catch (error) {
    showToast('Error loading doctors.', 'error');
  }
}

function setupBookingForm() {
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', handleBooking);
  }

  const dateInput = document.getElementById('appointment-date');
  if (dateInput) {
    dateInput.addEventListener('change', generateTimeSlots);
  }
}

async function generateTimeSlots() {
  const doctor = document.getElementById('doctor').value;
  const date = document.getElementById('appointment-date').value;
  const grid = document.getElementById('time-slots-grid');

  if (!doctor || !date || !grid) return;

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  // Fetch booked slots
  let bookedSlots = [];
  try {
    bookedSlots = await apiRequest('/appointments/booked-slots?doctor_name=' + encodeURIComponent(doctor) + '&date=' + date);
  } catch (error) {
    console.error('Error fetching booked slots:', error);
  }

  selectedTimeSlot = null;
  document.getElementById('time-slot').value = '';

  grid.innerHTML = timeSlots.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    return '<button type="button" class="time-slot-btn ' + (isBooked ? 'booked' : '') + '" ' +
      (isBooked ? 'disabled' : 'onclick="selectTimeSlot(this, \'' + slot + '\')"') + '>' +
      slot + '</button>';
  }).join('');

  updateBookingSummary();
}

function selectTimeSlot(btn, slot) {
  document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedTimeSlot = slot;
  document.getElementById('time-slot').value = slot;
  updateBookingSummary();
}

function updateBookingSummary() {
  const summary = document.getElementById('booking-summary');
  const doctor = document.getElementById('doctor').value;
  const department = document.getElementById('department').value;
  const date = document.getElementById('appointment-date').value;

  if (doctor && department && date && selectedTimeSlot) {
    summary.style.display = 'block';
    document.getElementById('summary-doctor').textContent = doctor;
    document.getElementById('summary-department').textContent = department;
    document.getElementById('summary-date').textContent = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('summary-time').textContent = selectedTimeSlot;
  } else {
    summary.style.display = 'none';
  }
}

async function handleBooking(e) {
  e.preventDefault();

  const doctor = document.getElementById('doctor').value;
  const department = document.getElementById('department').value;
  const date = document.getElementById('appointment-date').value;
  const timeSlot = selectedTimeSlot;

  if (!doctor || !department || !date || !timeSlot) {
    showToast('Please fill all fields and select a time slot.', 'error');
    return;
  }

  // Get doctor ID
  const selectedOption = document.getElementById('doctor').options[document.getElementById('doctor').selectedIndex];
  const doctorId = selectedOption.dataset.doctorId;

  showLoading();
  try {
    const data = await apiRequest('/appointments/book', {
      method: 'POST',
      body: {
        doctor_name: doctor,
        doctor_id: doctorId,
        department: department,
        appointment_date: date,
        time_slot: timeSlot
      }
    });

    // Store appointment data for payment page
    localStorage.setItem('smartq-pending-appointment', JSON.stringify(data.appointment));
    showToast('Appointment created! Redirecting to payment...', 'success');
    setTimeout(() => {
      window.location.href = '/payment.html';
    }, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function loadMyAppointments() {
  try {
    const appointments = await apiRequest('/appointments/my-appointments');
    const list = document.getElementById('appointments-list');
    if (!list) return;

    if (appointments.length === 0) {
      list.innerHTML = '<p class="empty-state">No appointments yet. Book your first appointment!</p>';
      return;
    }

    list.innerHTML = appointments.map(appt => {
      const statusClass = 'status-' + appt.status.toLowerCase();
      const dateStr = new Date(appt.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return '<div class="appointment-card">' +
        '<div class="appointment-card-header">' +
        '<span class="appointment-token">Token #' + appt.token_number + '</span>' +
        '<span class="appointment-status ' + statusClass + '">' + appt.status + '</span>' +
        '</div>' +
        '<div class="appointment-card-body">' +
        '<span><i class="fas fa-user-md"></i> ' + appt.doctor_name + '</span>' +
        '<span><i class="fas fa-hospital"></i> ' + appt.department + '</span>' +
        '<span><i class="fas fa-calendar"></i> ' + dateStr + '</span>' +
        '<span><i class="fas fa-clock"></i> ' + appt.time_slot + '</span>' +
        '</div></div>';
    }).join('');
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

// ===== PAYMENT PAGE =====
function initPaymentPage() {
  initApp();
  if (!requireAuth('patient')) return;

  const appointment = JSON.parse(localStorage.getItem('smartq-pending-appointment'));
  if (!appointment) {
    showToast('No pending appointment found.', 'error');
    setTimeout(() => {
      window.location.href = '/booking.html';
    }, 1500);
    return;
  }

  // Populate payment details
  document.getElementById('pay-doctor').textContent = appointment.doctor_name;
  document.getElementById('pay-department').textContent = appointment.department;
  document.getElementById('pay-date').textContent = new Date(appointment.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  document.getElementById('pay-time').textContent = appointment.time_slot;
  document.getElementById('pay-token').textContent = '#' + appointment.token_number;

  // Setup payment method toggles
  document.querySelectorAll('.payment-method-option').forEach(opt => {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.payment-method-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Demo payment card form
  const stripeEl = document.getElementById('stripe-card-element');
  if (stripeEl) {
    stripeEl.innerHTML = '<div style="padding: 8px 0; color: var(--text-muted); font-size: 0.85rem;">' +
      '<p style="margin-bottom: 8px;"><i class="fas fa-info-circle"></i> Demo Payment Mode</p>' +
      '<p style="font-size: 0.8rem;">Click "Pay" to simulate a successful payment.</p></div>';
  }
}

async function processPayment() {
  const appointment = JSON.parse(localStorage.getItem('smartq-pending-appointment'));
  if (!appointment) {
    showToast('No pending appointment.', 'error');
    return;
  }

  const payBtn = document.getElementById('pay-button');
  payBtn.disabled = true;
  payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  showLoading();
  try {
    // Create payment intent
    const paymentData = await apiRequest('/payments/create-intent', {
      method: 'POST',
      body: {
        appointment_id: appointment.id,
        amount: 500
      }
    });

    // Confirm payment (demo mode)
    const confirmData = await apiRequest('/payments/confirm', {
      method: 'POST',
      body: {
        appointment_id: appointment.id,
        payment_id: paymentData.paymentId || paymentData.paymentIntentId
      }
    });

    // Show success
    localStorage.removeItem('smartq-pending-appointment');
    hideLoading();

    document.getElementById('success-token').textContent = '#' + appointment.token_number;
    document.getElementById('success-doctor').textContent = appointment.doctor_name;
    document.getElementById('success-date').textContent = new Date(appointment.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('success-time').textContent = appointment.time_slot;

    openModal('payment-success-modal');
    showToast('Payment successful! Appointment confirmed.', 'success');

  } catch (error) {
    showToast(error.message || 'Payment failed. Please try again.', 'error');
    payBtn.disabled = false;
    payBtn.innerHTML = '<i class="fas fa-lock"></i> Pay &#8377;500';
  } finally {
    hideLoading();
  }
}

// ===== DOCTOR DASHBOARD =====
let doughnutChart = null;
let barChart = null;
let lineChart = null;

function initDashboardPage() {
  initApp();
  if (!requireAuth('doctor')) return;

  // Set doctor name in sidebar
  const sidebarUsername = document.getElementById('sidebar-username');
  if (sidebarUsername && currentUser) {
    sidebarUsername.textContent = currentUser.name;
  }

  // Dashboard title
  const dashTitle = document.getElementById('dashboard-title');

  // Sidebar navigation
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const section = this.dataset.section;

      // Update active link
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      // Show section
      document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
      const targetSection = document.getElementById('section-' + section);
      if (targetSection) targetSection.classList.add('active');

      // Update title
      const titles = {
        'queue': "Today's Queue",
        'token-calling': 'Token Calling',
        'analytics': 'Analytics',
        'records': 'Patient Records'
      };
      if (dashTitle) dashTitle.textContent = titles[section] || 'Dashboard';

      // Load section data
      if (section === 'analytics') loadAnalytics();
      if (section === 'records') loadPatientsList();
      if (section === 'token-calling') loadTokenCallingData();
    });
  });

  // Sidebar toggle (mobile)
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
    });
  }

  // Load initial data
  loadTodaysQueue();
  setInterval(loadTodaysQueue, 10000);
}

async function loadTodaysQueue() {
  try {
    const queue = await apiRequest('/appointments/queue');
    const tbody = document.getElementById('queue-table-body');
    if (!tbody) return;

    // Update stats
    const total = queue.length;
    const waiting = queue.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
    const completed = queue.filter(a => a.status === 'Completed').length;

    const dashTotal = document.getElementById('dash-total');
    const dashWaiting = document.getElementById('dash-waiting');
    const dashCompleted = document.getElementById('dash-completed');
    if (dashTotal) dashTotal.textContent = total;
    if (dashWaiting) dashWaiting.textContent = waiting;
    if (dashCompleted) dashCompleted.textContent = completed;

    if (queue.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-table">No appointments today.</td></tr>';
      return;
    }

    tbody.innerHTML = queue.map(appt => {
      const statusClass = 'status-' + appt.status.toLowerCase();
      const isActionable = appt.status !== 'Completed' && appt.status !== 'Cancelled';
      return '<tr>' +
        '<td><span class="token-badge">' + appt.token_number + '</span></td>' +
        '<td>' + appt.patient_name + '</td>' +
        '<td>' + appt.department + '</td>' +
        '<td>' + appt.time_slot + '</td>' +
        '<td><span class="appointment-status ' + statusClass + '">' + appt.status + '</span></td>' +
        '<td>' +
        (isActionable ?
          '<button class="btn btn-success btn-sm" onclick="markCompleted(' + appt.id + ')"><i class="fas fa-check"></i> Complete</button>' +
          ' <button class="btn btn-sm" style="background:rgba(59,130,246,0.1);color:#3b82f6;" onclick="viewPatientRecordsFromQueue(' + appt.patient_id + ')"><i class="fas fa-file-medical"></i></button>'
          : '<span style="color: var(--text-muted);">-</span>') +
        '</td></tr>';
    }).join('');
  } catch (error) {
    console.error('Error loading queue:', error);
  }
}

async function markCompleted(appointmentId) {
  try {
    await apiRequest('/appointments/status/' + appointmentId, {
      method: 'PUT',
      body: { status: 'Completed' }
    });
    showToast('Appointment marked as completed.', 'success');
    loadTodaysQueue();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function viewPatientRecordsFromQueue(patientId) {
  // Switch to records section and load patient
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.sidebar-link[data-section="records"]').classList.add('active');
  document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-records').classList.add('active');
  document.getElementById('dashboard-title').textContent = 'Patient Records';

  loadPatientsList().then(() => {
    loadPatientRecords(patientId);
  });
}

// ===== Token Calling =====
async function loadTokenCallingData() {
  try {
    const queue = await apiRequest('/appointments/queue');
    const upcoming = queue.filter(a => a.status === 'Confirmed' || (a.status === 'Pending' && a.payment_status === 'Paid'));

    const upcomingDiv = document.getElementById('upcoming-tokens');
    if (!upcomingDiv) return;

    if (upcoming.length === 0) {
      upcomingDiv.innerHTML = '<p class="empty-state">No tokens in queue.</p>';
      return;
    }

    upcomingDiv.innerHTML = upcoming.slice(0, 10).map(appt => {
      const statusClass = 'status-' + appt.status.toLowerCase();
      return '<div class="upcoming-token-item">' +
        '<span class="upcoming-token-num">#' + appt.token_number + '</span>' +
        '<span class="upcoming-token-name">' + appt.patient_name + '</span>' +
        '<span class="upcoming-token-status ' + statusClass + '">' + appt.status + '</span>' +
        '</div>';
    }).join('');
  } catch (error) {
    console.error('Error loading token data:', error);
  }
}

async function callNextToken() {
  const btn = document.getElementById('call-next-btn');
  btn.disabled = true;

  try {
    const data = await apiRequest('/appointments/call-next', {
      method: 'POST'
    });

    if (data.token) {
      const tokenNum = data.token.token_number;
      const patientName = data.token.patient_name;

      // Update display
      document.getElementById('current-token-num').textContent = tokenNum;
      document.getElementById('current-patient-name').textContent = patientName;

      // Add animation
      const display = document.querySelector('.current-token-number');
      display.style.animation = 'none';
      display.offsetHeight; // Trigger reflow
      display.style.animation = 'successPop 0.5s ease-out';

      // Voice announcement using SpeechSynthesis
      announceToken(tokenNum);

      showToast('Token #' + tokenNum + ' called.', 'success');
      loadTokenCallingData();
    } else {
      showToast(data.message || 'No more tokens.', 'info');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function announceToken(tokenNumber) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      'Token number ' + tokenNumber + ', please proceed to the consultation room.'
    );
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-IN';

    window.speechSynthesis.speak(utterance);
  }
}

// ===== Analytics =====
async function loadAnalytics() {
  try {
    const data = await apiRequest('/analytics');

    // Update summary stats
    document.getElementById('analytics-total-appointments').textContent = data.totals.appointments;
    document.getElementById('analytics-total-patients').textContent = data.totals.patients;
    document.getElementById('analytics-total-doctors').textContent = data.totals.doctors;
    document.getElementById('analytics-total-revenue').textContent = '₹' + Number(data.totals.revenue).toLocaleString();

    // Doughnut Chart - Waiting vs Completed
    const doughnutCtx = document.getElementById('doughnut-chart');
    if (doughnutCtx) {
      if (doughnutChart) doughnutChart.destroy();
      doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Waiting', 'Completed', 'Cancelled'],
          datasets: [{
            data: [data.today.waiting, data.today.completed, data.today.cancelled],
            backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true,
                font: { family: 'Inter', size: 12 }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Bar Chart - Per Doctor
    const barCtx = document.getElementById('bar-chart');
    if (barCtx) {
      if (barChart) barChart.destroy();
      const doctorNames = data.perDoctor.map(d => d.doctor_name.replace('Dr. ', ''));
      const doctorCounts = data.perDoctor.map(d => d.count);
      const barColors = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: doctorNames,
          datasets: [{
            label: 'Appointments',
            data: doctorCounts,
            backgroundColor: barColors.slice(0, doctorNames.length),
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { family: 'Inter' } },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              ticks: { font: { family: 'Inter', size: 11 } },
              grid: { display: false }
            }
          }
        }
      });
    }

    // Line Chart - Daily Visits
    const lineCtx = document.getElementById('line-chart');
    if (lineCtx) {
      if (lineChart) lineChart.destroy();
      const dates = data.dailyVisits.map(d => new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
      const counts = data.dailyVisits.map(d => d.count);

      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Patient Visits',
            data: counts,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#0d9488',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { family: 'Inter' } },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              ticks: { font: { family: 'Inter', size: 11 } },
              grid: { display: false }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showToast('Error loading analytics data.', 'error');
  }
}

// ===== Patient Records =====
let currentPatientId = null;

async function loadPatientsList() {
  try {
    const patients = await apiRequest('/records/patients');
    const list = document.getElementById('patients-list');
    if (!list) return;

    if (patients.length === 0) {
      list.innerHTML = '<p class="empty-state">No patients found.</p>';
      return;
    }

    list.innerHTML = patients.map(p => {
      return '<div class="patient-item" data-id="' + p.id + '" onclick="loadPatientRecords(' + p.id + ')">' +
        '<div class="patient-item-info">' +
        '<span class="patient-item-name">' + p.name + '</span>' +
        '<span class="patient-item-email">' + p.email + '</span>' +
        '</div>' +
        '<button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); openRecordsModal(' + p.id + ')">' +
        '<i class="fas fa-eye"></i> View' +
        '</button></div>';
    }).join('');

    // Search functionality
    const searchInput = document.getElementById('patient-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        document.querySelectorAll('.patient-item').forEach(item => {
          const name = item.querySelector('.patient-item-name').textContent.toLowerCase();
          const email = item.querySelector('.patient-item-email').textContent.toLowerCase();
          item.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
        });
      });
    }
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

async function loadPatientRecords(patientId) {
  currentPatientId = patientId;

  // Highlight active patient
  document.querySelectorAll('.patient-item').forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.id) === patientId);
  });

  try {
    const data = await apiRequest('/records/patient/' + patientId);
    const content = document.getElementById('records-detail-content');
    if (!content) return;

    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    if (data.patient) {
      html += '<div><strong>' + data.patient.name + '</strong><br><small style="color:var(--text-muted);">' + data.patient.email + ' | ' + (data.patient.phone || 'N/A') + '</small></div>';
    }
    html += '<button class="btn btn-primary btn-sm" onclick="openAddRecordModal(' + patientId + ')"><i class="fas fa-plus"></i> Add Record</button>';
    html += '</div>';

    if (data.records.length === 0) {
      html += '<p class="empty-state">No records found for this patient.</p>';
    } else {
      html += data.records.map(record => {
        const visitDate = new Date(record.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        return '<div class="record-item">' +
          '<div class="record-item-header">' +
          '<span class="record-date"><i class="fas fa-calendar"></i> ' + visitDate + '</span>' +
          '<span class="record-doctor">' + (record.doctor_name || 'Unknown') + '</span>' +
          '</div>' +
          '<div class="record-field"><div class="record-field-label">Diagnosis</div><div class="record-field-value">' + record.diagnosis + '</div></div>' +
          (record.prescription ? '<div class="record-field"><div class="record-field-label">Prescription</div><div class="record-field-value">' + record.prescription + '</div></div>' : '') +
          (record.doctor_notes ? '<div class="record-field"><div class="record-field-label">Doctor Notes</div><div class="record-field-value">' + record.doctor_notes + '</div></div>' : '') +
          '</div>';
      }).join('');
    }

    content.innerHTML = html;
  } catch (error) {
    showToast('Error loading patient records.', 'error');
  }
}

async function openRecordsModal(patientId) {
  try {
    const data = await apiRequest('/records/patient/' + patientId);
    const content = document.getElementById('view-records-content');
    if (!content) return;

    let html = '';
    if (data.patient) {
      html += '<div style="margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-md);">' +
        '<strong>' + data.patient.name + '</strong><br>' +
        '<small style="color:var(--text-muted);">' + data.patient.email + ' | ' + (data.patient.phone || 'N/A') + '</small></div>';
    }

    if (data.records.length === 0) {
      html += '<p class="empty-state">No medical records found.</p>';
    } else {
      html += data.records.map(record => {
        const visitDate = new Date(record.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        return '<div class="record-item">' +
          '<div class="record-item-header">' +
          '<span class="record-date"><i class="fas fa-calendar"></i> ' + visitDate + '</span>' +
          '<span class="record-doctor">' + (record.doctor_name || 'Unknown') + '</span>' +
          '</div>' +
          '<div class="record-field"><div class="record-field-label">Diagnosis</div><div class="record-field-value">' + record.diagnosis + '</div></div>' +
          (record.prescription ? '<div class="record-field"><div class="record-field-label">Prescription</div><div class="record-field-value">' + record.prescription + '</div></div>' : '') +
          (record.doctor_notes ? '<div class="record-field"><div class="record-field-label">Doctor Notes</div><div class="record-field-value">' + record.doctor_notes + '</div></div>' : '') +
          '</div>';
      }).join('');
    }

    content.innerHTML = html;
    openModal('view-records-modal');
  } catch (error) {
    showToast('Error loading records.', 'error');
  }
}

function openAddRecordModal(patientId) {
  document.getElementById('record-patient-id').value = patientId;
  document.getElementById('record-visit-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('add-record-form').reset();
  document.getElementById('record-patient-id').value = patientId;
  document.getElementById('record-visit-date').value = new Date().toISOString().split('T')[0];
  openModal('add-record-modal');

  // Setup form submit
  const form = document.getElementById('add-record-form');
  form.onsubmit = async function (e) {
    e.preventDefault();

    const recordData = {
      patient_id: parseInt(document.getElementById('record-patient-id').value),
      diagnosis: document.getElementById('record-diagnosis').value,
      prescription: document.getElementById('record-prescription').value,
      doctor_notes: document.getElementById('record-notes').value,
      visit_date: document.getElementById('record-visit-date').value
    };

    showLoading();
    try {
      await apiRequest('/records/add', {
        method: 'POST',
        body: recordData
      });
      showToast('Record added successfully!', 'success');
      closeModal('add-record-modal');
      loadPatientRecords(patientId);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      hideLoading();
    }
  };
}

// ===== RECORDS PAGE (Patient View) =====
async function initRecordsPage() {
  initApp();
  if (!requireAuth('patient')) return;
  updateNavForUser();

  try {
    const data = await apiRequest('/records/patient/' + currentUser.id);
    const content = document.getElementById('records-page-content');
    if (!content) return;

    if (data.records.length === 0) {
      content.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;"><p class="empty-state">No medical records found. Your records will appear here after doctor visits.</p></div>';
      return;
    }

    content.innerHTML = data.records.map(record => {
      const visitDate = new Date(record.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      return '<div class="glass-card" style="padding:20px;margin-bottom:16px;">' +
        '<div class="record-item-header">' +
        '<span class="record-date"><i class="fas fa-calendar"></i> ' + visitDate + '</span>' +
        '<span class="record-doctor">' + (record.doctor_name || 'Unknown') + '</span>' +
        '</div>' +
        '<div class="record-field"><div class="record-field-label">Diagnosis</div><div class="record-field-value">' + record.diagnosis + '</div></div>' +
        (record.prescription ? '<div class="record-field"><div class="record-field-label">Prescription</div><div class="record-field-value">' + record.prescription + '</div></div>' : '') +
        (record.doctor_notes ? '<div class="record-field"><div class="record-field-label">Doctor Notes</div><div class="record-field-value">' + record.doctor_notes + '</div></div>' : '') +
        '</div>';
    }).join('');
  } catch (error) {
    showToast('Error loading your records.', 'error');
  }
}
