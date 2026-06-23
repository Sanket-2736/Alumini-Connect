

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'student' },
  university: mongoose.Schema.Types.ObjectId,
  department: String,
  batch: String,
  isEmailVerified: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  skills: [String],
  verificationDocs: [String],
  refreshTokens: [String],
  notificationPreferences: {
    emailOnMessage: { type: Boolean, default: true },
    emailOnConnection: { type: Boolean, default: true },
    emailOnJob: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@12345';
    const adminName = 'Admin User';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      return;
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    const admin = new User({
      fullName: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
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
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
