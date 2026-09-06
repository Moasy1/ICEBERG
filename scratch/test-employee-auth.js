const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../lib/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026';

async function verifyAuth() {
  await mongoose.connect(process.env.MONGODB_URI);

  const testAccounts = ['fady', 'asy', 'abanoub', 'steven', 'baher', 'admin'];

  for (const identifier of testAccounts) {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }]
    }).select('+password');

    if (!user) {
      console.error(`❌ User ${identifier} not found!`);
      continue;
    }

    const isMatch = await user.comparePassword('password');
    console.log(`User: ${user.full_name} (${user.username || user.email}) | Password is 'password': ${isMatch} | must_change_password: ${user.must_change_password}`);
  }

  await mongoose.disconnect();
}

verifyAuth();
