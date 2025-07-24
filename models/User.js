const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  shortBio: { type: String, required: true },
  location: {
    lat: { type: Number },
    long: { type: Number }
  },
  updatedAt: { type: Date, default: Date.now },
  test: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema); 