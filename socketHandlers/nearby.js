const User = require('../models/User');
const { getDistanceFromLatLonInMeters } = require('../utils/location');

// In-memory map: socketId -> { userId, location }
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
    { $project: { _id: 1, name: 1, location: 1, test: 1 } }
  ]);
  return fakeUsers;
}

function formatNearbyUser(user, fromLocation, online = false) {
  let distance = null;
  if (fromLocation && user.location && typeof user.location.lat === 'number' && typeof user.location.long === 'number') {
    distance = getDistanceFromLatLonInMeters(
      fromLocation.lat, fromLocation.long,
      user.location.lat, user.location.long
    );
  }
  return {
    userId: user.userId || user._id,
    name: user.name,
    username: user.username,
    location: user.location,
    test: user.test || false,
    distance,
    online
  };
}

function registerNearbyHandlers(socket, io) {
  socket.on('user-info', (data) => {
    connectedUsers.set(socket.id, {
      userId: data.userId,
      location: data.location
    });
  });

  socket.on('update-location', async (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.location = data.location;
      // Find all users within 50m (real + offline)
      let realNearby = [];
      if (user.location) {
        const allUsers = await User.find({ location: { $exists: true } });
        for (const u of allUsers) {
          if (!u.location) continue;
          if (u._id.toString() === user.userId?.toString()) continue;
          const dist = getDistanceFromLatLonInMeters(
            user.location.lat, user.location.long,
            u.location.lat, u.location.long
          );
          if (dist <= 50) {
            const isOnline = Array.from(connectedUsers.values()).some(cu => cu.userId?.toString() === u._id.toString());
            realNearby.push(formatNearbyUser(u, user.location, isOnline));
          }
        }
      }
      // Always fetch enough fake GPS users to ensure at least 5 dummy users
      let fakeGps = [];
      if (user.location) {
        const allDummies = await User.find({ test: true, location: { $exists: true } });
        fakeGps = allDummies.filter(u =>
          u.location && getDistanceFromLatLonInMeters(user.location.lat, user.location.long, u.location.lat, u.location.long) <= 50
        ).map(u => formatNearbyUser(u, user.location, false));
      }
      while (fakeGps.length < 5) {
        fakeGps.push(formatNearbyUser({
          _id: `dummy_${Date.now()}_${Math.random()}`,
          name: `Dummy GPS User`,
          username: `dummy_gps_${Date.now()}_${Math.floor(Math.random()*10000)}`,
          location: user.location,
          test: true
        }, user.location, false));
      }
      const allNearby = [...realNearby, ...fakeGps].filter((v,i,a)=>a.findIndex(t=>(t.userId.toString()===v.userId.toString()))===i);
      io.to(socket.id).emit('nearby-user', { users: allNearby });
      // console.log('[WebSocket nearby-user sent]', allNearby);
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
  });
}

module.exports = { registerNearbyHandlers }; 