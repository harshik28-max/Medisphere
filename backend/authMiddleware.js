const jwt = require('jsonwebtoken');

// ===== VERIFY TOKEN =====
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // ✅ check header exists
        if (!authHeader) {
            return res.status(401).json({
                message: 'No token provided, access denied'
            });
        }

        // ✅ check format: Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Invalid token format'
            });
        }

        // ✅ extract token safely
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Token missing'
            });
        }

        // ✅ verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ attach user data
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();

    } catch (err) {
        console.error('JWT Error:', err.message);

        return res.status(403).json({
            message: 'Invalid or expired token'
        });
    }
};

// ===== VERIFY ADMIN =====
const verifyAdmin = (req, res, next) => {
    if (!req.userRole || req.userRole !== 'admin') {
        return res.status(403).json({
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };