const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../lib/models/User');
const Client = require('../lib/models/Client');
const ClientMember = require('../lib/models/ClientMember');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGODB_URI in environment!');
  process.exit(1);
}

const EMPLOYEES = [
  {
    user_id: 'usr_fady',
    username: 'fady',
    email: 'fady@icebergma.com',
    full_name: 'Fady',
    role: 'CEO',
    department: 'OPERATIONS',
    cost_rates: { hourly_cost: 600, currency: 'EGP' },
    capacity: { weekly_hours: 40 }
  },
  {
    user_id: 'usr_asy',
    username: 'asy',
    email: 'asy@icebergma.com',
    full_name: 'Mohamed Asy',
    role: 'SUPER_ADMIN',
    department: 'WEB_DEV',
    cost_rates: { hourly_cost: 500, currency: 'EGP' },
    capacity: { weekly_hours: 40 }
  },
  {
    user_id: 'usr_abanoub',
    username: 'abanoub',
    email: 'abanoub@icebergma.com',
    full_name: 'Abanoub',
    role: 'MarketingManager',
    department: 'PERFORMANCE_MARKETING',
    cost_rates: { hourly_cost: 400, currency: 'EGP' },
    capacity: { weekly_hours: 40 }
  },
  {
    user_id: 'usr_steven',
    username: 'steven',
    email: 'steven@icebergma.com',
    full_name: 'Steven',
    role: 'SPECIALIST',
    department: 'VIDEO_PRODUCTION',
    cost_rates: { hourly_cost: 350, currency: 'EGP' },
    capacity: { weekly_hours: 40 }
  },
  {
    user_id: 'usr_baher',
    username: 'baher',
    email: 'baher@icebergma.com',
    full_name: 'Baher',
    role: 'CreativeDirector',
    department: 'BRANDING',
    cost_rates: { hourly_cost: 350, currency: 'EGP' },
    capacity: { weekly_hours: 40 }
  }
];

async function seedEmployeesAndResetPasswords() {
  try {
    console.log('[Seed]: Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed]: Connected.');

    // 1. Upsert employee accounts with default password 'password' and must_change_password = true
    for (const emp of EMPLOYEES) {
      let user = await User.findOne({ $or: [{ email: emp.email }, { user_id: emp.user_id }, { username: emp.username }] });
      if (!user) {
        user = new User({
          ...emp,
          password: 'password',
          must_change_password: true,
          is_active: true
        });
        await user.save();
        console.log(`✅ Created account for employee: ${emp.full_name} (${emp.email}) [Role: ${emp.role}]`);
      } else {
        user.user_id = emp.user_id;
        user.username = emp.username;
        user.full_name = emp.full_name;
        user.role = emp.role;
        user.department = emp.department;
        user.password = 'password';
        user.must_change_password = true;
        user.is_active = true;
        await user.save();
        console.log(`🔄 Updated account for employee: ${emp.full_name} (${emp.email}) with password 'password'`);
      }
    }

    // 2. Set all other existing accounts to have password 'password' and must_change_password = true
    const allUsers = await User.find({});
    for (const u of allUsers) {
      u.password = 'password';
      u.must_change_password = true;
      await u.save();
      console.log(`🔑 Reset password to 'password' for: ${u.full_name} (${u.email || u.username})`);
    }

    // 3. Ensure ClientMember entries exist for all clients so staff have access
    const clients = await Client.find({}).lean();
    console.log(`[Seed]: Syncing ClientMember permissions across ${clients.length} clients...`);
    for (const emp of EMPLOYEES) {
      for (const client of clients) {
        const canManage = emp.role === 'CEO' || emp.role === 'SUPER_ADMIN' || emp.role === 'MarketingManager';
        await ClientMember.findOneAndUpdate(
          { client_id: client.client_id, user_id: emp.user_id },
          { client_id: client.client_id, user_id: emp.user_id, can_manage: canManage },
          { upsert: true, new: true }
        );
      }
    }
    console.log('✅ Client memberships synced.');

    console.log('\n🎉 Successfully created/updated all employee accounts with initial password: "password"');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedEmployeesAndResetPasswords();
