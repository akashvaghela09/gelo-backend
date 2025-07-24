const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { randomNearbyLocation } = require('../utils/location');

const hasValidLocation = (location) => {
  return location && typeof location.lat === 'number' && typeof location.long === 'number';
};

const register = async (req, res) => {
  try {
    const { username, password, name, contactNumber, shortBio, location } = req.body;
    // Require either both lat and long
    if (!username || !password || !name || !contactNumber || !shortBio) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    // Convert username to lowercase
    const usernameLower = username.toLowerCase();
    // Check if user exists
    const existingUser = await User.findOne({ username: usernameLower });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = new User({
      username: usernameLower,
      password: hashedPassword,
      name,
      contactNumber,
      shortBio,
      location: hasValidLocation(location) ? location : undefined,
      test: false
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
    // Convert username to lowercase for case-insensitive login
    const usernameLower = username.toLowerCase();
    const user = await User.findOne({ username: usernameLower });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: {
      id: user._id,
      username: user.username,
      name: user.name,
      contactNumber: user.contactNumber,
      shortBio: user.shortBio,
      location: user.location
    }});
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const checkUsername = async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ available: false, message: 'Username is required' });
  }
  const exists = await User.exists({ username });
  res.json({ available: !exists });
};

module.exports = {
  hasValidLocation,
  register,
  login,
  checkUsername
}; 