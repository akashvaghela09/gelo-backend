const locationUtils = require('../../utils/location');

describe('Location Utils', () => {
  it('should calculate correct distance (Haversine)', () => {
    const d = locationUtils.getDistanceFromLatLonInMeters(0, 0, 0, 1);
    expect(typeof d).toBe('number');
    expect(d).toBeGreaterThan(0);
  });

  it('should generate a random nearby location within 20m', () => {
    const base = { lat: 12.9716, long: 77.5946 };
    const loc = locationUtils.randomNearbyLocation(base.lat, base.long, 20);
    const d = locationUtils.getDistanceFromLatLonInMeters(base.lat, base.long, loc.lat, loc.long);
    expect(d).toBeLessThanOrEqual(20);
  });
}); 