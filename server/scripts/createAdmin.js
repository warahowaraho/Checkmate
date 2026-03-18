const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/checkmate');

    const existingAdmin = await Admin.findOne({ 
      $or: [{ username: 'superadmin' }, { email: 'admin@checkmate.com' }]
    });

    if (existingAdmin) {
      console.log('? Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const superAdmin = new Admin({
      username: 'superadmin',
      email: 'admin@checkmate.com',
      password: hashedPassword,
      role: 'superadmin',
      permissions: [
        'manage_users', 'manage_games', 'manage_tournaments',
        'manage_reports', 'manage_settings', 'view_analytics'
      ]
    });

    await superAdmin.save();
    console.log('\n' + '='.repeat(50));
    console.log('? SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('?? Username: superadmin');
    console.log('?? Password: Admin123!');
    console.log('??  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('? Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

createSuperAdmin();
