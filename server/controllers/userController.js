const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users — for member pickers and bug assignment dropdowns
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email role').sort('name');
  res.json(users);
});

module.exports = { getUsers };
