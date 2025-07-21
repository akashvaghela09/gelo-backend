require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const connectDB = require('../config/db');
const { randomBluetoothId } = require('../utils/bluetooth').default;

function generateUsername(name) {
  // Lowercase, replace spaces with dots, remove non-alphanumeric except dot, append 6 random numbers
  const base = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${base}.${rand}`;
}

async function generateFakeUserData() {
  const prompt = `Generate a JSON object for a fake user with the following fields: name (full name), firstName, shortBio. Only return the JSON object, no extra text or explanation.`;
  const response = await axios.post('http://localhost:11434/v1/chat/completions', {
    model: 'gemma3:1b',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ]
  });
  let data = response.data.choices[0].message.content;
  data = data.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(data);
    return parsed;
  } catch (e) {
    return {
      name: 'John Doe',
      firstName: 'John',
      shortBio: 'I am a friendly test user.'
    };
  }
}

async function createFakeBluetoothUsers(count = 100) {
  await connectDB();
  const fakeUsers = [];
  for (let i = 0; i < count; i++) {
    const fake = await generateFakeUserData();
    const username = generateUsername(fake.name || 'user');
    fakeUsers.push({
      username,
      password: 'fakepassword', // Not used, but required
      name: fake.name,
      contactNumber: '0000000000',
      shortBio: fake.shortBio,
      bluetoothId: randomBluetoothId(),
      test: true
    });
  }
  await User.insertMany(fakeUsers);
  console.log(`${count} fake users created.`);
  mongoose.connection.close();
}

createFakeBluetoothUsers(); 