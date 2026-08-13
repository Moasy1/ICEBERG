const app = require('../api/index.js');

const server = app.listen(3999, async () => {
  console.log('Test server running on port 3999');
  try {
    console.log('Testing GET /api/notifications...');
    const res = await fetch('http://localhost:3999/api/notifications');
    const data = await res.json();
    console.log('GET /api/notifications response:', res.status, data);

    if (data.success && Array.isArray(data.notifications)) {
      console.log('✅ GET /api/notifications SUCCESS! Count:', data.count, 'Unread:', data.unreadCount);
    } else {
      console.error('❌ FAILED GET /api/notifications');
      process.exit(1);
    }

    console.log('Testing POST /api/notifications...');
    const postRes = await fetch('http://localhost:3999/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'leads',
        title: 'Test Live Lead Notification',
        message: 'Test message for verification',
        section: 'idex-leads'
      })
    });
    const postData = await postRes.json();
    console.log('POST /api/notifications response:', postRes.status, postData);

    if (postData.success) {
      console.log('✅ POST /api/notifications SUCCESS!');
    } else {
      console.error('❌ FAILED POST /api/notifications');
      process.exit(1);
    }

    console.log('Testing PUT /api/notifications/read-all...');
    const readRes = await fetch('http://localhost:3999/api/notifications/read-all', { method: 'PUT' });
    const readData = await readRes.json();
    console.log('PUT /api/notifications/read-all response:', readRes.status, readData);

    if (readData.success) {
      console.log('✅ PUT /api/notifications/read-all SUCCESS!');
    } else {
      console.error('❌ FAILED PUT /api/notifications/read-all');
      process.exit(1);
    }

    console.log('\n🎉 ALL BACKEND NOTIFICATION TESTS PASSED SUCCESSFULLY!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    server.close();
    process.exit(1);
  }
});
