const User = require('../models/User');
const { getDistanceFromLatLonInMeters } = require('../utils/location');

// In-memory map: socketId -> { userId, location, bluetoothId }
const connectedUsers = new Map();

async function getFakeGpsUsers(location, count = 3) {
  if (!location) return [];
  // Find 3 random test users with location near the given point
  const fakeUsers = await User.aggregate([
    { $match: { test: true, location: { $exists: true } } },
    { $addFields: {
      distance: {
        $sqrt: {
          $add: [
            { $pow: [{ $subtract: ['$location.lat', location.lat] }, 2] },
            { $pow: [{ $subtract: ['$location.long', location.long] }, 2] }
          ]
        }
      }
    } },
    { $sort: { distance: 1 } },
    { $limit: count },
    { $project: { _id: 1, name: 1, location: 1, bluetoothId: 1, test: 1 } }
  ]);
  return fakeUsers;
}

async function getFakeBluetoothUsers(count = 2) {
  const fakeUsers = await User.aggregate([
    { $match: { test: true, bluetoothId: { $exists: true } } },
    { $sample: { size: count } },
    { $project: { _id: 1, name: 1, location: 1, bluetoothId: 1, test: 1 } }
  ]);
  return fakeUsers;
}

function formatNearbyUser(user) {
  return {
    userId: user.userId || user._id,
    name: user.name,
    location: user.location,
    bluetoothId: user.bluetoothId,
    test: user.test || false
  };
}

function registerNearbyHandlers(socket, io) {
  socket.on('user-info', (data) => {
    connectedUsers.set(socket.id, {
      userId: data.userId,
      location: data.location,
      bluetoothId: data.bluetoothId
    });
  });

  socket.on('update-location', async (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.location = data.location;
      user.bluetoothId = data.bluetoothId;
      // Find real nearby users
      let realNearby = [];
      for (const [otherSocketId, otherUser] of connectedUsers.entries()) {
        if (otherSocketId === socket.id) continue;
        let isNearby = false;
        if (user.location && otherUser.location) {
          isNearby = getDistanceFromLatLonInMeters(
            user.location.lat, user.location.long,
            otherUser.location.lat, otherUser.location.long
          ) <= 20;
        }
        if (!isNearby && user.bluetoothId && otherUser.bluetoothId) {
          isNearby = user.bluetoothId === otherUser.bluetoothId;
        }
        if (isNearby) {
          realNearby.push(formatNearbyUser(otherUser));
        }
      }
      // Always fetch 3 fake GPS users and 2 fake Bluetooth users if location exists, else 5 fake Bluetooth users
      let fakeGps = [];
      let fakeBt = [];
      if (user.location) {
        fakeGps = await getFakeGpsUsers(user.location, 3);
        fakeBt = await getFakeBluetoothUsers(2);
      } else {
        fakeBt = await getFakeBluetoothUsers(5);
      }
      const fakeNearby = [...fakeGps, ...fakeBt].map(formatNearbyUser);
      // Combine and send (no duplicates)
      const allNearby = [...realNearby, ...fakeNearby].filter((v,i,a)=>a.findIndex(t=>(t.userId.toString()===v.userId.toString()))===i);
      io.to(socket.id).emit('nearby-user', { users: allNearby });
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
  });
}

module.exports = { registerNearbyHandlers }; 