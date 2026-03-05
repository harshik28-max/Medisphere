const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const authorizeDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Access denied. Doctor privileges required.' });
  }
  next();
};

const authorizePatient = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Access denied. Patient privileges required.' });
  }
  next();
};

module.exports = { authenticateToken, authorizeDoctor, authorizePatient };
