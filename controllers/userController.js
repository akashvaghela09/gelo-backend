const User = require('../models/User');
const { getDistanceFromLatLonInMeters } = require('../utils/location');

const updateUserProfile = async (req, res) => {
  try {
    const { name, contactNumber, shortBio, location, bluetoothId } = req.body;
    if (!name || !contactNumber || !shortBio) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }
    const update = { name, contactNumber, shortBio, location, bluetoothId, updatedAt: new Date() };
    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, bluetoothId } = req.query;
    // Require both latitude and longitude for GPS search
    const hasLocation = latitude !== undefined && longitude !== undefined;
    if ((!hasLocation && !bluetoothId) || (hasLocation && (latitude === '' || longitude === ''))) {
      return res.status(400).json({ message: 'At least both latitude and longitude (for GPS) or Bluetooth ID must be provided.' });
    }
    let users = [];
    if (hasLocation) {
      // Find users within 20 meters
      const allUsers = await User.find({ location: { $exists: true } });
      users = users.concat(allUsers.filter(u => {
        if (!u.location || u._id.equals(req.user.userId)) return false;
        return getDistanceFromLatLonInMeters(
          Number(latitude), Number(longitude),
          u.location.lat, u.location.long
        ) <= 20;
      }));
    }
    if (bluetoothId) {
      // Find users with matching bluetoothId (excluding self)
      const btUsers = await User.find({ bluetoothId, _id: { $ne: req.user.userId } });
      users = users.concat(btUsers);
    }
    // Remove duplicates (by user id)
    const uniqueUsers = Array.from(new Map(users.map(u => [u._id.toString(), u])).values());
    res.json({ users: uniqueUsers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  updateUserProfile,
  getNearbyUsers
}; 