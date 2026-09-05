const mongoose = require('mongoose');
const User = require('../lib/models/User');
const Client = require('../lib/models/Client');
const ClientMember = require('../lib/models/ClientMember');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ username: { $in: ['CEO', 'CreativeDirector', 'MarketingManger'] } }).select('+password');
    console.log('Seeded Users in DB:');
    for (const u of users) {
      const match = await u.comparePassword(
        u.username === 'CEO' ? 'CEO-IB2026' :
        u.username === 'CreativeDirector' ? 'CD-IB2026' : 'MM-IB2026'
      );
      console.log(`  👤 ${u.username} | Role: ${u.role} | Password check: ${match ? 'PASS ✅' : 'FAIL ❌'}`);
    }
    const internalClients = await Client.find({ is_internal: true });
    console.log('\nInternal Clients in DB:');
    internalClients.forEach(c => console.log(`  🏢 ${c.company_name} (slug: ${c.slug}, is_internal: ${c.is_internal})`));
    
    const count = await ClientMember.countDocuments();
    console.log(`\nTotal ClientMember Mappings: ${count}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
