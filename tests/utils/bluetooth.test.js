const bluetoothUtils = require('../../utils/bluetooth');

describe('Bluetooth Utils', () => {
  it('should generate a random Bluetooth ID', () => {
    const id = bluetoothUtils.randomBluetoothId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('FAKE_BT_')).toBe(true);
    expect(id.length).toBeGreaterThan(8);
  });
}); 