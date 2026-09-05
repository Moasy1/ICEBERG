/**
 * RBAC Client Seed Script
 * 
 * Seeds the exact clients and users from the PostgreSQL specification
 * into MongoDB Atlas using Mongoose + bcryptjs.
 * 
 * Clients: 8 (7 external + 1 internal "Iceberg")
 * Users: 3 (CEO, CreativeDirector, MarketingManger) with bcrypt-hashed passwords
 * 
 * Usage: node scripts/seed-rbac-clients.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Client = require('../lib/models/Client');
const User = require('../lib/models/User');
const ClientMember = require('../lib/models/ClientMember');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hmanmahmed_db_user:V4lKIpvmjTI7nn3K@iceberg.4dboitw.mongodb.net/iceberg_cms?retryWrites=true&w=majority';

// ── Client Seed Data (from PostgreSQL INSERT) ────────────────────────────────
const CLIENTS = [
  { company_name: 'DentaQuik',                slug: 'dentaquik',              is_internal: false },
  { company_name: 'Musical Bag',              slug: 'musical-bag',            is_internal: false },
  { company_name: 'The Call For Whorship',     slug: 'the-call-for-whorship',  is_internal: false },
  { company_name: 'Drum Shop',                slug: 'drum-shop',              is_internal: false },
  { company_name: 'Ghost Note',               slug: 'ghost-note',             is_internal: false },
  { company_name: 'Golden Perfume',            slug: 'golden-perfume',         is_internal: false },
  { company_name: 'Acrostone & Waterpik',      slug: 'acrostone-waterpik',     is_internal: false },
  { company_name: 'Iceberg (Internal)',        slug: 'iceberg-internal',       is_internal: true  }
];

// ── User Seed Data (from PostgreSQL INSERT) ──────────────────────────────────
// Passwords hashed with bcrypt gen_salt('bf', 10) equivalent
const USERS = [
  {
    username:  'MarketingManger',
    email:     'mm@icebergma.com',
    full_name: 'Marketing Manager',
    role:      'MarketingManager',
    password:  'MM-IB2026',
    department: 'PERFORMANCE_MARKETING'
  },
  {
    username:  'CreativeDirector',
    email:     'cd@icebergma.com',
    full_name: 'Creative Director',
    role:      'CreativeDirector',
    password:  'CD-IB2026',
    department: 'BRANDING'
  },
  {
    username:  'CEO',
    email:     'ceo@icebergma.com',
    full_name: 'CEO (Principal)',
    role:      'CEO',
    password:  'CEO-IB2026',
    department: 'OPERATIONS'
  }
];

async function seedRBACData() {
  console.log('🔐 RBAC Client-Scoping Seed — Starting...\n');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // ── 1. Seed Clients ────────────────────────────────────────────────────────
  console.log('── Seeding Clients ──────────────────────────────────');
  for (const clientData of CLIENTS) {
    const existing = await Client.findOne({
      $or: [
        { company_name: clientData.company_name },
        { slug: clientData.slug }
      ]
    });

    if (existing) {
      // Update slug and is_internal if they were missing
      let changed = false;
      if (!existing.slug && clientData.slug) { existing.slug = clientData.slug; changed = true; }
      if (existing.is_internal !== clientData.is_internal) { existing.is_internal = clientData.is_internal; changed = true; }
      if (changed) await existing.save();
      console.log(`  ↻ ${clientData.company_name} — already exists (updated: ${changed})`);
    } else {
      const newClient = new Client({
        company_name: clientData.company_name,
        slug: clientData.slug,
        is_internal: clientData.is_internal,
        status: clientData.is_internal ? 'ACTIVE_RETAINER' : 'ONBOARDING',
        contact_person: {
          name: clientData.is_internal ? 'Iceberg Team' : 'Contact TBD',
          email: clientData.is_internal ? 'admin@icebergma.com' : `contact@${clientData.slug}.com`
        }
      });
      await newClient.save();
      console.log(`  ✅ ${clientData.company_name} — created (slug: ${clientData.slug}, internal: ${clientData.is_internal})`);
    }
  }

  // ── 2. Seed Users ──────────────────────────────────────────────────────────
  console.log('\n── Seeding Users ───────────────────────────────────');
  for (const userData of USERS) {
    const existing = await User.findOne({
      $or: [
        { username: userData.username },
        { email: userData.email }
      ]
    });

    if (existing) {
      // ON CONFLICT (username) DO UPDATE — update password hash and role
      existing.role = userData.role;
      existing.username = userData.username;
      existing.full_name = userData.full_name;
      existing.department = userData.department;
      // Re-hash password (the pre-save hook handles bcrypt)
      existing.password = userData.password;
      await existing.save();
      console.log(`  ↻ ${userData.username} — updated (role: ${userData.role})`);
    } else {
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        password: userData.password, // bcrypt hashed by pre-save hook
        department: userData.department
      });
      await newUser.save();
      console.log(`  ✅ ${userData.username} — created (role: ${userData.role}, email: ${userData.email})`);
    }
  }

  // ── 3. Seed ClientMember mappings (all internal users → all clients) ────────
  console.log('\n── Seeding Client Member Mappings ───────────────────');
  const allClients = await Client.find({});
  const allUsers = await User.find({ role: { $in: ['CEO', 'CreativeDirector', 'MarketingManager'] } });

  for (const user of allUsers) {
    for (const client of allClients) {
      const userId = user.user_id || user._id.toString();
      const clientId = client.client_id || client._id.toString();

      try {
        await ClientMember.findOneAndUpdate(
          { client_id: clientId, user_id: userId },
          {
            client_id: clientId,
            user_id: userId,
            can_manage: user.role === 'CEO'
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        // Duplicate key is fine — skip
      }
    }
    console.log(`  ✅ ${user.username || user.email} → mapped to ${allClients.length} client(s)`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const clientCount = await Client.countDocuments();
  const userCount = await User.countDocuments();
  const memberCount = await ClientMember.countDocuments();

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  📊 Seed Summary`);
  console.log(`  ├── Clients:        ${clientCount}`);
  console.log(`  ├── Users:          ${userCount}`);
  console.log(`  └── Client Members: ${memberCount}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('\n🔐 RBAC seed complete!\n');

  // Print login credentials for verification
  console.log('── Login Credentials ───────────────────────────────');
  console.log('  CEO              → username: CEO,              password: CEO-IB2026');
  console.log('  CreativeDirector → username: CreativeDirector, password: CD-IB2026');
  console.log('  MarketingManger  → username: MarketingManger,  password: MM-IB2026');
  console.log('  Demo Admin       → username: admin,            password: iceberg-dev');
  console.log('');

  await mongoose.disconnect();
}

seedRBACData().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
