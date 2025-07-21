require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

async function deleteTestUsers() {
  await connectDB();
  const result = await User.deleteMany({ test: true });
  console.log(`Deleted ${result.deletedCount} test users.`);
  mongoose.connection.close();
}

deleteTestUsers(); 