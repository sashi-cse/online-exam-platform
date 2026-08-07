const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@school.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log(`🔍 Checking if Super Admin account (${adminEmail}) exists...`);

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`ℹ️ Admin account (${adminEmail}) already exists. Ensuring role is 'admin'...`);
      admin.role = 'admin';
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
    } else {
      console.log(`👤 Creating new Super Admin account (${adminEmail})...`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      admin = await User.create({
        name: 'System Super Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log(`✅ Super Admin created successfully!`);
    }

    console.log(`🔑 Credentials:\n   Email: ${adminEmail}\n   Role : admin`);
  } catch (err) {
    console.error('❌ Failed to seed Admin account:', err.message);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
