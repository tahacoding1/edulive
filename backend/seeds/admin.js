require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const email = process.env.ADMIN_EMAIL || 'admin@edulive.app';
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`✅  Upgraded existing user "${existing.name}" to admin`);
    } else {
      console.log(`ℹ️   Admin already exists: ${existing.name} (${email})`);
    }
  } else {
    const admin = await User.create({
      name:     process.env.ADMIN_NAME     || 'Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role:     'admin',
    });
    console.log(`✅  Admin created: ${admin.name} (${email})`);
    console.log(`    Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('    ⚠️  Change the password after first login!');
  }

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
