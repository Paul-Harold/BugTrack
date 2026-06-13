const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach the user to the request
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Restrict a route to specific roles, e.g. authorize('qa', 'manager')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden: requires role ${roles.join(' or ')} (you are ${req.user.role})`,
    });
  }
  next();
};

module.exports = { protect, authorize };
