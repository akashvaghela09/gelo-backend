const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { randomNearbyLocation } = require('../utils/location');
const { randomBluetoothId } = require('../utils/bluetooth');

const hasValidLocation = (location) => {
  return location && typeof location.lat === 'number' && typeof location.long === 'number';
};

const register = async (req, res) => {
  try {
    const { username, password, name, contactNumber, shortBio, location, bluetoothId } = req.body;
    // Require either both lat and long, or bluetoothId
    const hasLocation = hasValidLocation(location);
    if (!username || !password || !name || !contactNumber || !shortBio || (!hasLocation && !bluetoothId)) {
      return res.status(400).json({ message: 'All required fields must be provided, including either both lat and long or bluetoothId.' });
    }
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      name,
      contactNumber,
      shortBio,
      location: hasLocation ? location : undefined,
      bluetoothId,
      test: false
    });
    await user.save();
    // Always create 3 fake GPS users (if GPS provided) and 2 fake Bluetooth users
    const fakeUsers = [];
    if (hasLocation) {
      for (let i = 0; i < 3; i++) {
        const fakeLoc = randomNearbyLocation(location.lat, location.long, 20);
        fakeUsers.push(new User({
          username: `test_gps_${username}_${i}_${Date.now()}`,
          password: hashedPassword,
          name: `Fake GPS User ${i+1}`,
          contactNumber: '0000000000',
          shortBio: 'I am a fake nearby user.',
          location: fakeLoc,
          test: true
        }));
      }
    }
    for (let i = 0; i < 2; i++) {
      fakeUsers.push(new User({
        username: `test_bt_${username}_${i}_${Date.now()}`,
        password: hashedPassword,
        name: `Fake Bluetooth User ${i+1}`,
        contactNumber: '0000000000',
        shortBio: 'I am a fake Bluetooth user.',
        bluetoothId: randomBluetoothId(),
        test: true
      }));
    }
    if (fakeUsers.length > 0) {
      await User.insertMany(fakeUsers);
    }
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
    const user = await User.findOne({ username });
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
      location: user.location,
      bluetoothId: user.bluetoothId
    }});
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  hasValidLocation,
  register,
  login
}; 