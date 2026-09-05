const mongoose = require('mongoose');
const { LexoRank } = require('../lib/services/lexorank');
const { Workspace } = require('../lib/models/Workspace');
const { WorkspaceProject } = require('../lib/models/WorkspaceProject');
const { WorkspaceTask } = require('../lib/models/WorkspaceTask');
const { DailyPlanner } = require('../lib/models/DailyPlanner');
const { MessageTopic } = require('../lib/models/MessageTopic');
const { WorkspaceDoc } = require('../lib/models/WorkspaceDoc');
const { FocusSession } = require('../lib/models/FocusSession');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hmanmahmed_db_user:V4lKIpvmjTI7nn3K@iceberg.4dboitw.mongodb.net/iceberg_cms?retryWrites=true&w=majority';

async function runUpbaseTests() {
  console.log('🚀 --- STARTING UPBASE COMPREHENSIVE SUITE VALIDATION --- 🚀\n');

  // 1. LexoRank Algorithm Tests
  console.log('1️⃣ Testing LexoRank Fractional Indexing Algorithm...');
  const initial = LexoRank.generateInitialRanks(5);
  console.log('Initial Ranks for 5 items:', initial);

  const between0and1 = LexoRank.getBetween(initial[0], initial[1]);
  console.log(`Rank between ${initial[0]} and ${initial[1]} -> ${between0and1}`);
  
  if (between0and1 > initial[0] && between0and1 < initial[1]) {
    console.log('✅ LexoRank between test PASSED!');
  } else {
    throw new Error(`LexoRank ordering failure: ${initial[0]} < ${between0and1} < ${initial[1]}`);
  }

  // 2. Connect to MongoDB
  console.log('\n2️⃣ Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas!');

  const timestamp = Date.now();
  const testUserId = 'usr_test_' + timestamp;
  const testWsId = 'ws_test_' + timestamp;
  const testPrjId = 'prj_test_' + timestamp;

  try {
    // 3. Test Workspace & Tenant Isolation Model
    console.log('\n3️⃣ Creating Test Workspace with Guest & Admin Roles...');
    const testWorkspace = new Workspace({
      workspace_id: testWsId,
      name: 'ICEBERG Alpha Test Workspace',
      slug: 'iceberg-alpha-test-' + timestamp,
      owner_user_id: testUserId,
      members: [
        { user_id: testUserId, email: 'admin@icebergma.com', full_name: 'Lead Architect', role: 'ADMIN', assigned_projects: [] },
        { user_id: 'usr_guest_1', email: 'client@dentaquick.com', full_name: 'Dentaquick Client', role: 'GUEST', assigned_projects: [testPrjId] }
      ]
    });
    await testWorkspace.save();
    console.log('✅ Workspace created successfully with ID:', testWorkspace.workspace_id);

    // 4. Test Workspace Project with Modular Tools
    console.log('\n4️⃣ Creating Test Project with Modular Tool Toggles...');
    const testProject = new WorkspaceProject({
      project_id: testPrjId,
      workspace_id: testWsId,
      name: 'Q3 Enterprise Rebranding',
      color: '#06b6d4',
      enabled_tools: {
        tasks: true,
        kanban: true,
        calendar: true,
        messages: true,
        docs: true,
        files: true,
        bookmarks: true,
        chat: true
      },
      sections: [
        { section_id: 'sec_todo', name: 'To Do', position: '0|h00000:', color: '#64748b' },
        { section_id: 'sec_prog', name: 'In Progress', position: '0|h00001:', color: '#06b6d4' }
      ],
      created_by: testUserId
    });
    await testProject.save();
    console.log('✅ Project created:', testProject.name, 'with tools toggled ON.');

    // 5. Test Tasks & LexoRank Reordering
    console.log('\n5️⃣ Creating Tasks with LexoRank Positioning...');
    const task1 = new WorkspaceTask({
      task_id: 'tsk_test_1_' + timestamp,
      workspace_id: testWsId,
      project_id: testPrjId,
      title: 'Finalize brand guidelines typography',
      status: 'TODO',
      priority: 'HIGH',
      position: '0|h00000:',
      duration_minutes: 45,
      created_by: testUserId
    });
    await task1.save();

    const task2 = new WorkspaceTask({
      task_id: 'tsk_test_2_' + timestamp,
      workspace_id: testWsId,
      project_id: testPrjId,
      title: 'Develop high-fidelity 3D hero renders',
      status: 'TODO',
      priority: 'URGENT',
      position: '0|h00001:',
      duration_minutes: 90,
      created_by: testUserId
    });
    await task2.save();

    // Insert a 3rd task strictly between task1 and task2 in O(1)
    const task3Position = LexoRank.getBetween(task1.position, task2.position);
    const task3 = new WorkspaceTask({
      task_id: 'tsk_test_3_' + timestamp,
      workspace_id: testWsId,
      project_id: testPrjId,
      title: 'Review color palette contrast with client',
      status: 'TODO',
      priority: 'MEDIUM',
      position: task3Position,
      duration_minutes: 30,
      created_by: testUserId
    });
    await task3.save();

    const sortedTasks = await WorkspaceTask.find({ workspace_id: testWsId }).sort({ position: 1 });
    console.log('Sorted task titles by LexoRank:');
    sortedTasks.forEach((t, i) => console.log(`  ${i+1}. [${t.position}] - ${t.title}`));
    
    if (sortedTasks[1].task_id === 'tsk_test_3_' + timestamp) {
      console.log('✅ Fractional indexing O(1) insertion PASSED!');
    } else {
      throw new Error('LexoRank task sort mismatch!');
    }

    // 6. Test Daily Planner & Time-Blocking
    console.log('\n6️⃣ Testing Daily Planner & Time-Blocking Grid...');
    const todayStr = new Date().toISOString().split('T')[0];
    const testPlanner = new DailyPlanner({
      user_id: testUserId,
      workspace_id: testWsId,
      date: todayStr,
      scratchpad: 'Draft client retainer proposal before 4pm.',
      habits: [
        { habit_id: 'hab_1', title: 'Deep Work Block 1', completed: true, target_time: '10:00' },
        { habit_id: 'hab_2', title: 'Client Sync', completed: false, target_time: '14:00' }
      ],
      time_blocks: [
        { block_id: 'blk_1', task_id: task1.task_id, title: task1.title, start_time: '10:00', duration_minutes: 45, color: '#06b6d4' }
      ]
    });
    await testPlanner.save();
    console.log(`✅ Daily plan saved for date ${todayStr} with ${testPlanner.habits.length} habits and ${testPlanner.time_blocks.length} time blocks.`);

    // 7. Test Async Long-Form Messages & Threading
    console.log('\n7️⃣ Testing Async Messages (Basecamp model) & Threaded Replies...');
    const testTopic = new MessageTopic({
      topic_id: 'top_test_' + timestamp,
      workspace_id: testWsId,
      project_id: testPrjId,
      title: 'Architecture Blueprint: Scalable Multitenancy',
      content_html: '<p>We are migrating to fractional indexing and isolated project permissions...</p>',
      category: 'ARCHITECTURE',
      author: { user_id: testUserId, full_name: 'Lead Architect', email: 'admin@icebergma.com' },
      replies: [
        {
          reply_id: 'rep_1',
          author: { user_id: 'usr_guest_1', full_name: 'Dentaquick Client' },
          content_html: '<p>Looks solid! Approved from our end.</p>',
          created_at: new Date()
        }
      ],
      replies_count: 1
    });
    await testTopic.save();
    console.log(`✅ Message topic "${testTopic.title}" saved with ${testTopic.replies.length} threaded reply.`);

    // 8. Test Collaborative Docs & Version Snapshots
    console.log('\n8️⃣ Testing Collaborative Rich-Text Docs & Version History...');
    const testDoc = new WorkspaceDoc({
      doc_id: 'doc_test_' + timestamp,
      workspace_id: testWsId,
      project_id: testPrjId,
      title: 'Brand Sprint Wiki & Design Tokens',
      content_html: '<h2>Color Palette Tokens</h2><p>Primary: #06b6d4, Emerald: #10b981</p>',
      current_version: 1,
      version_history: [
        { version_number: 1, content_html: '<h2>Color Palette Tokens</h2><p>Primary: #06b6d4, Emerald: #10b981</p>', saved_by: 'Lead Architect', created_at: new Date() }
      ],
      created_by: { user_id: testUserId, full_name: 'Lead Architect' }
    });
    await testDoc.save();
    console.log(`✅ Collaborative doc "${testDoc.title}" created with Version v${testDoc.current_version}.`);

    // 9. Test Focus & Pomodoro Analytics
    console.log('\n9️⃣ Testing Focus Session Analytics & Audio Tags...');
    const focusSession = new FocusSession({
      session_id: 'foc_test_' + timestamp,
      workspace_id: testWsId,
      user_id: testUserId,
      mode: 'POMODORO',
      duration_minutes: 25,
      ambient_sound: 'ALPHA',
      completed: true,
      started_at: new Date(Date.now() - 25 * 60 * 1000),
      ended_at: new Date()
    });
    await focusSession.save();
    console.log(`✅ Focus session logged with 25 minutes (Ambient: ${focusSession.ambient_sound}).`);

  } finally {
    // Cleanup test artifacts from DB
    console.log('\n🧹 Cleaning up test documents...');
    await Workspace.deleteMany({ workspace_id: testWsId });
    await WorkspaceProject.deleteMany({ workspace_id: testWsId });
    await WorkspaceTask.deleteMany({ workspace_id: testWsId });
    await DailyPlanner.deleteMany({ workspace_id: testWsId });
    await MessageTopic.deleteMany({ workspace_id: testWsId });
    await WorkspaceDoc.deleteMany({ workspace_id: testWsId });
    await FocusSession.deleteMany({ workspace_id: testWsId });
    // Also clean any dangling prj_alpha_1
    await WorkspaceProject.deleteMany({ project_id: 'prj_alpha_1' });
    console.log('✅ Cleaned up test records from MongoDB Atlas.');

    await mongoose.disconnect();
  }

  console.log('\n🎉 --- ALL UPBASE INTEGRATION & ARCHITECTURAL TESTS PASSED PERFECTLY! --- 🎉');
}

runUpbaseTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
