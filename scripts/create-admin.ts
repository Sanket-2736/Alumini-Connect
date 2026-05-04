/**
 * Script to create an admin user
 * Usage: npx ts-node scripts/create-admin.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
import User from '../models/User';

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@12345';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create a dummy university ID (you can update this later)
    const dummyUniversityId = new mongoose.Types.ObjectId();

    // Create admin user
    const admin = new User({
      fullName: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      university: dummyUniversityId,
      department: 'Administration',
      batch: '2024',
      isEmailVerified: true,
      skills: [],
      verificationDocs: [],
      refreshTokens: [],
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📝 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('🔐 Login Instructions:');
    console.log('   1. Go to http://localhost:3000/admin/login');
    console.log(`   2. Enter email: ${adminEmail}`);
    console.log(`   3. Enter password: ${adminPassword}`);
    console.log('   4. Click "Login"');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');

    await mongoose.connection.close();
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
