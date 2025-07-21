const randomBluetoothId = () => {
  return 'FAKE_BT_' + Math.random().toString(36).substring(2, 12).toUpperCase();
};

module.exports = {
  randomBluetoothId
}; 