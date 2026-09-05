const mongoose = require('mongoose');
const { Workspace } = require('../lib/models/Workspace');
const { WorkspaceProject } = require('../lib/models/WorkspaceProject');
const { WorkspaceTask } = require('../lib/models/WorkspaceTask');
const { DailyPlanner } = require('../lib/models/DailyPlanner');
const { MessageTopic } = require('../lib/models/MessageTopic');
const { ChatMessage } = require('../lib/models/ChatMessage');
const { WorkspaceDoc } = require('../lib/models/WorkspaceDoc');
const { ProjectBookmark } = require('../lib/models/ProjectBookmark');
const { FocusSession } = require('../lib/models/FocusSession');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hmanmahmed_db_user:V4lKIpvmjTI7nn3K@iceberg.4dboitw.mongodb.net/iceberg_cms?retryWrites=true&w=majority';

async function seedUpbaseData() {
  console.log('🌱 Seeding Upbase Workspaces, Planner, and Hybrid Productivity Data...');
  await mongoose.connect(MONGO_URI);

  const wsId = 'ws_iceberg_master';
  const ownerId = 'usr_demo_admin';
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Seed Workspace
  let workspace = await Workspace.findOne({ workspace_id: wsId });
  if (!workspace) {
    workspace = new Workspace({
      workspace_id: wsId,
      name: 'ICEBERG Master Workspace',
      slug: 'iceberg-master',
      description: 'Primary agency workspace for sprint deliverables, personal time-blocking, and client collaboration.',
      owner_id: ownerId,
      owner_user_id: ownerId,
      members: [
        { user_id: ownerId, email: 'admin@icebergma.com', full_name: 'Agency Principal', role: 'ADMIN', assigned_projects: [] },
        { user_id: 'usr_sarah', email: 'sarah@icebergma.com', full_name: 'Sarah Jenkins (Account Lead)', role: 'MEMBER', assigned_projects: [] },
        { user_id: 'usr_tarek', email: 'tarek@dentaquick.com', full_name: 'Dr. Tarek (Dentaquick Client)', role: 'GUEST', assigned_projects: ['prj_sprint_14'] }
      ]
    });
    await workspace.save();
    console.log('✅ Master Workspace created.');
  }

  // 2. Seed Projects
  const prjId1 = 'prj_sprint_14';
  let prj1 = await WorkspaceProject.findOne({ project_id: prjId1 });
  if (!prj1) {
    prj1 = new WorkspaceProject({
      project_id: prjId1,
      workspace_id: wsId,
      name: 'Sprint 14: Dentaquick MENA Launch',
      slug: 'sprint-14-dentaquick',
      description: 'Q3 Brand redesign, omnichannel lead funnels, and CRM workflow integration',
      color: '#06b6d4',
      icon: 'briefcase',
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
        { section_id: 'sec_progress', name: 'In Progress', position: '0|h00001:', color: '#06b6d4' },
        { section_id: 'sec_review', name: 'Client Review', position: '0|h00002:', color: '#f59e0b' },
        { section_id: 'sec_done', name: 'Completed', position: '0|h00003:', color: '#10b981' }
      ],
      created_by: ownerId
    });
    await prj1.save();
    console.log('✅ Project 1 (Dentaquick Launch) created.');
  }

  // 3. Seed Tasks with LexoRank Positions
  const tasksCount = await WorkspaceTask.countDocuments({ workspace_id: wsId });
  if (tasksCount === 0) {
    const seedTasks = [
      {
        task_id: 'tsk_101',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Review Brand Identity Guidelines & Typography Hierarchy',
        status: 'TODO',
        priority: 'HIGH',
        position: '0|h00000:',
        due_date: todayStr,
        scheduled_date: todayStr,
        start_time: '09:00',
        duration_minutes: 60,
        subtasks: [
          { subtask_id: 'st_1', title: 'Verify primary cyan #06b6d4 contrast ratio', completed: true },
          { subtask_id: 'st_2', title: 'Arabic font pairing with Outfit & Inter', completed: false }
        ],
        created_by: ownerId
      },
      {
        task_id: 'tsk_102',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Build Web Audio Synthesizer & Pomodoro Flow State Studio',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        position: '0|h00001:',
        due_date: todayStr,
        scheduled_date: todayStr,
        start_time: '11:00',
        duration_minutes: 90,
        subtasks: [
          { subtask_id: 'st_3', title: '10Hz Alpha Waves binaural oscillator', completed: true },
          { subtask_id: 'st_4', title: 'Rain pink noise buffer filter', completed: true }
        ],
        created_by: ownerId
      },
      {
        task_id: 'tsk_103',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Deploy Client Portal Isolation & RLS Guest Scoping',
        status: 'REVIEW',
        priority: 'HIGH',
        position: '0|h00002:',
        due_date: todayStr,
        duration_minutes: 45,
        created_by: ownerId
      },
      {
        task_id: 'tsk_104',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Setup LexoRank Fractional Indexing Engine for O(1) Reordering',
        status: 'DONE',
        priority: 'MEDIUM',
        position: '0|h00003:',
        duration_minutes: 30,
        created_by: ownerId
      }
    ];

    await WorkspaceTask.insertMany(seedTasks);
    console.log('✅ Tasks seeded with LexoRank positions.');
  }

  // 4. Seed Daily Planner
  let planner = await DailyPlanner.findOne({ user_id: ownerId, workspace_id: wsId, date: todayStr });
  if (!planner) {
    planner = new DailyPlanner({
      user_id: ownerId,
      workspace_id: wsId,
      date: todayStr,
      scratchpad: '• Client retainer check-in scheduled for 2:30 PM\n• Review new LexoRank drag-and-drop animations\n• Confirm Egypt tax invoice ledger export',
      habits: [
        { habit_id: 'hab_1', title: 'Review Active Client Sprint Backlog', completed: true, target_time: '09:00' },
        { habit_id: 'hab_2', title: 'Deep Work Flow Block (90m)', completed: true, target_time: '11:00' },
        { habit_id: 'hab_3', title: 'Inbox & Async Basecamp Messages Zero', completed: false, target_time: '15:00' },
        { habit_id: 'hab_4', title: 'Daily Retrospective & Productivity Reflection', completed: false, target_time: '18:00' }
      ],
      time_blocks: [
        { block_id: 'blk_1', task_id: 'tsk_101', title: 'Review Brand Identity Guidelines & Typography', start_time: '09:00', duration_minutes: 60, color: '#06b6d4', completed: true },
        { block_id: 'blk_2', task_id: 'tsk_102', title: 'Build Web Audio Synthesizer & Flow Studio', start_time: '11:00', duration_minutes: 90, color: '#10b981', completed: false },
        { block_id: 'blk_3', task_id: 'tsk_103', title: 'Deploy Client Portal Isolation & RLS Scoping', start_time: '14:30', duration_minutes: 45, color: '#f59e0b', completed: false }
      ],
      reflection_note: 'Sprint 14 velocity is up 35% with fractional indexing in place.',
      productivity_score: 5
    });
    await planner.save();
    console.log('✅ Daily Planner & Time blocks seeded.');
  }

  // 5. Seed Async Message Topics
  const topicCount = await MessageTopic.countDocuments({ workspace_id: wsId });
  if (topicCount === 0) {
    const topic = new MessageTopic({
      topic_id: 'top_arch_blueprint',
      workspace_id: wsId,
      project_id: prjId1,
      title: 'Architectural Blueprint: Hybrid Workspaces & LexoRank Positioning',
      category: 'ARCHITECTURE',
      body_html: '<p>Team, here is the architectural summary for our Upbase hybrid productivity engine:</p><ul><li><strong>LexoRank:</strong> Fractional base-36 midpoint strings prevent cascading SQL/NoSQL rewrites during Kanban card drags.</li><li><strong>Time-Blocking:</strong> 24h hourly grid maps due tasks straight into calendar blocks.</li><li><strong>Guest Isolation:</strong> Clients only see explicitly assigned project lists.</li></ul>',
      author: {
        user_id: ownerId,
        full_name: 'Agency Principal',
        avatar_url: '',
        role: 'ADMIN'
      },
      is_pinned: true,
      replies: [
        {
          reply_id: 'rep_1',
          author: { user_id: 'usr_sarah', full_name: 'Sarah Jenkins (Account Lead)' },
          body_html: '<p>The fractional indexing reordering is super responsive! Clients are loving the real-time card transitions.</p>',
          created_at: new Date()
        }
      ]
    });
    await topic.save();
    console.log('✅ Async Message Topic seeded.');
  }

  // 6. Seed Collaborative Rich Doc
  const docCount = await WorkspaceDoc.countDocuments({ workspace_id: wsId });
  if (docCount === 0) {
    const doc = new WorkspaceDoc({
      doc_id: 'doc_design_tokens',
      workspace_id: wsId,
      project_id: prjId1,
      title: 'ICEBERG Design Tokens & Brand Wiki',
      category: 'WIKI',
      content_html: '<h2>🎨 Core Agency Tokens</h2><p><strong>Primary Glow:</strong> <code>#06b6d4</code> (Cyan-500)<br><strong>Success Accent:</strong> <code>#10b981</code> (Emerald-500)<br><strong>Background Glass:</strong> <code>#020617 / rgba(15, 23, 42, 0.8)</code></p><h3>Client Deliverable Guidelines</h3><p>All client facing assets must adhere to dark glassmorphic styling and WCAG AA contrast standards.</p>',
      current_version: 1,
      version_history: [
        {
          version_number: 1,
          title: 'Initial Brand Wiki Setup',
          content_html: '<h2>🎨 Core Agency Tokens</h2><p><strong>Primary Glow:</strong> <code>#06b6d4</code> (Cyan-500)</p>',
          saved_by: 'Agency Principal',
          created_at: new Date(Date.now() - 3600000)
        }
      ],
      created_by: { user_id: ownerId, full_name: 'Agency Principal' },
      last_modified_by: { user_id: ownerId, full_name: 'Agency Principal' }
    });
    await doc.save();
    console.log('✅ Collaborative Rich Doc seeded.');
  }

  // 7. Seed Project Bookmark
  const bmarkCount = await ProjectBookmark.countDocuments({ workspace_id: wsId });
  if (bmarkCount === 0) {
    const bmark = new ProjectBookmark({
      bookmark_id: 'bmk_figma_system',
      workspace_id: wsId,
      project_id: prjId1,
      url: 'https://www.figma.com/@icebergagency',
      title: 'ICEBERG Master UI Design System (Figma)',
      description: 'Master component library with glassmorphic cards, LexoRank Kanban components, and timer widgets.',
      domain: 'figma.com',
      tags: ['Design', 'UI', 'Figma'],
      created_by: { user_id: ownerId, full_name: 'Agency Principal' }
    });
    await bmark.save();
    console.log('✅ Bookmark seeded.');
  }

  // 8. Seed Chat Messages
  const chatCount = await ChatMessage.countDocuments({ workspace_id: wsId });
  if (chatCount === 0) {
    const chat1 = new ChatMessage({
      message_id: 'msg_welcome_1',
      workspace_id: wsId,
      project_id: prjId1,
      channel_id: 'general',
      sender: { user_id: ownerId, full_name: 'Agency Principal', role: 'ADMIN' },
      text: '🚀 Welcome to the new Upbase-grade hybrid workspace! Check out the Daily Planner and Kanban board with LexoRank indexing.',
      reactions: [{ emoji: '🚀', count: 3, users: [ownerId, 'usr_sarah', 'usr_tarek'] }]
    });
    await chat1.save();
    console.log('✅ Chat message seeded.');
  }

  await mongoose.disconnect();
  console.log('✨ Upbase demo dataset seeded successfully into MongoDB Atlas!');
}

seedUpbaseData().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
