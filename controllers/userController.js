const User = require('../models/User');
const { getDistanceFromLatLonInMeters, randomNearbyLocation } = require('../utils/location');

const updateUserProfile = async (req, res) => {
  const allowedFields = ['name', 'contactNumber', 'shortBio', 'location'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'At least one field is required to update.' });
  }
  try {
    // If updating location, ensure at least 5 dummy users within 50m
    if (updates.location && typeof updates.location.lat === 'number' && typeof updates.location.long === 'number') {
      const lat = updates.location.lat;
      const long = updates.location.long;
      // Find dummy users within 50m
      const dummyNearby = await User.find({
        test: true,
        location: { $exists: true }
      });
      const nearbyCount = dummyNearby.filter(u =>
        u.location && getDistanceFromLatLonInMeters(lat, long, u.location.lat, u.location.long) <= 50
      ).length;
      const toCreate = 5 - nearbyCount;
      if (toCreate > 0) {
        const newDummies = [];
        for (let i = 0; i < toCreate; i++) {
          const fakeLoc = randomNearbyLocation(lat, long, 50);
          newDummies.push(new User({
            username: `dummy_gps_${i}_${Math.floor(Math.random()*10000)}`,
            password: 'dummy',
            name: `Dummy GPS User ${i+1}`,
            contactNumber: '0000000000',
            shortBio: 'I am a dummy GPS user.',
            location: fakeLoc,
            test: true
          }));
        }
        if (newDummies.length > 0) {
          await User.insertMany(newDummies);
        }
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, select: '-password' }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const hasLocation = latitude !== undefined && longitude !== undefined;
    if (!hasLocation || latitude === '' || longitude === '') {
      return res.status(400).json({ message: 'Both latitude and longitude (for GPS) must be provided.' });
    }
    let users = [];
    if (hasLocation) {
      // Find users within 50 meters
      const allUsers = await User.find({ location: { $exists: true } });
      users = users.concat(allUsers.filter(u => {
        if (!u.location || u._id.equals(req.user.userId)) return false;
        return getDistanceFromLatLonInMeters(
          Number(latitude), Number(longitude),
          u.location.lat, u.location.long
        ) <= 50;
      }));
    }
    // Remove duplicates (by user id)
    const uniqueUsers = Array.from(new Map(users.map(u => [u._id.toString(), u])).values());
    res.json({ users: uniqueUsers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  updateUserProfile,
  getNearbyUsers,
  getMe
}; 