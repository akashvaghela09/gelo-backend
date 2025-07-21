// Haversine formula to calculate distance in meters between two lat/long points
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Generate a random location within a given radius (meters) of a point
const randomNearbyLocation = (lat, long, maxDistanceMeters = 20) => {
  const r = maxDistanceMeters * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  const R = 6371000;
  const dLat = r * Math.cos(theta) / R * (180 / Math.PI);
  const dLon = r * Math.sin(theta) / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  return {
    lat: lat + dLat,
    long: long + dLon
  };
};

module.exports = {
  getDistanceFromLatLonInMeters,
  randomNearbyLocation
}; 