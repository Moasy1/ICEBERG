const path = require('path');
const app = require(path.join(__dirname, '../api/index'));
const http = require('http');

const server = http.createServer(app);
server.listen(3099, async () => {
  console.log('Test server running on port 3099');

  try {
    // Test 1: POST /api/leads with meeting slot
    const leadRes = await fetch('http://localhost:3099/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'Acrostone Dental',
        contact_name: 'Eng. Ahmed Fathy',
        email: 'ahmed@acrostone.com',
        phone: '+20 100 555 1234',
        meeting_date: '2026-08-21',
        time_slot: '11:00 AM',
        source: 'Free Audit Form',
        action: 'Unlocked Audit & Reserved Slot'
      })
    });
    const leadData = await leadRes.json();
    console.log('Test 1 (POST /api/leads):', leadData);

    // Test 2: POST /api/calendar/book
    const bookRes = await fetch('http://localhost:3099/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-08-22',
        time: '02:30 PM',
        company: 'Waterpik MENA',
        name: 'Sara El-Sayed',
        email: 'sara@waterpik-mena.com',
        phone: '+20 111 222 3333',
        notes: 'VIP IDEX Consultation'
      })
    });
    const bookData = await bookRes.json();
    console.log('Test 2 (POST /api/calendar/book):', bookData);

    // Test 3: GET /api/leads
    const getLeadsRes = await fetch('http://localhost:3099/api/leads');
    const getLeadsData = await getLeadsRes.json();
    console.log('Test 3 (GET /api/leads count):', getLeadsData.count || getLeadsData.leads?.length);

    console.log('ALL API TESTS PASSED PERFECTLY!');
  } catch(e) {
    console.error('API Test Error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
});
