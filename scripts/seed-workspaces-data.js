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
        { user_id: 'usr_fady', email: 'fady@icebergma.com', full_name: 'Fady', role: 'SUPER_ADMIN', assigned_projects: [] },
        { user_id: 'usr_asy', email: 'asy@icebergma.com', full_name: 'Mohamed Asy', role: 'ADMIN', assigned_projects: [] },
        { user_id: 'usr_abanoub', email: 'abanoub@icebergma.com', full_name: 'Abanoub', role: 'MEMBER', assigned_projects: [] },
        { user_id: 'usr_steven', email: 'steven@icebergma.com', full_name: 'Steven', role: 'MEMBER', assigned_projects: [] },
        { user_id: 'usr_baher', email: 'baher@icebergma.com', full_name: 'Baher', role: 'MEMBER', assigned_projects: [] }
      ]
    });
    await workspace.save();
    console.log('✅ Master Workspace created.');
  }

  // 2. Seed Projects (All 8 Client Scopes from Spec)
  const CLIENT_PROJECTS = [
    { id: 'prj_dentaquik', name: 'DentaQuik (Growth & Funnel)', slug: 'dentaquik', color: '#06b6d4', icon: 'briefcase' },
    { id: 'prj_musical_bag', name: 'Musical Bag (E-Commerce & Brand)', slug: 'musical-bag', color: '#8b5cf6', icon: 'music' },
    { id: 'prj_call_worship', name: 'The Call For Whorship (Media Campaign)', slug: 'the-call-for-whorship', color: '#f59e0b', icon: 'radio' },
    { id: 'prj_drum_shop', name: 'Drum Shop (Omnichannel Retainer)', slug: 'drum-shop', color: '#ef4444', icon: 'disc' },
    { id: 'prj_ghost_note', name: 'Ghost Note (Creative & Social)', slug: 'ghost-note', color: '#ec4899', icon: 'sparkles' },
    { id: 'prj_golden_perfume', name: 'Golden Perfume (Luxury Brand Launch)', slug: 'golden-perfume', color: '#eab308', icon: 'gem' },
    { id: 'prj_acrostone', name: 'Acrostone & Waterpik (B2B Distribution)', slug: 'acrostone-waterpik', color: '#10b981', icon: 'building' },
    { id: 'prj_iceberg_internal', name: 'Iceberg (Internal Operations & Dev)', slug: 'iceberg-internal', color: '#3b82f6', icon: 'shield' }
  ];

  const defaultSections = [
    { section_id: 'sec_todo', name: 'To Do', position: '0|h00000:', color: '#64748b' },
    { section_id: 'sec_progress', name: 'In Progress', position: '0|h00001:', color: '#06b6d4' },
    { section_id: 'sec_review', name: 'Client Review', position: '0|h00002:', color: '#f59e0b' },
    { section_id: 'sec_done', name: 'Completed', position: '0|h00003:', color: '#10b981' }
  ];

  for (const cp of CLIENT_PROJECTS) {
    let prj = await WorkspaceProject.findOne({ project_id: cp.id });
    if (!prj) {
      prj = new WorkspaceProject({
        project_id: cp.id,
        workspace_id: wsId,
        name: cp.name,
        slug: cp.slug,
        description: `Dedicated workspace project space for ${cp.name}`,
        color: cp.color,
        icon: cp.icon,
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
        sections: defaultSections,
        created_by: ownerId
      });
      await prj.save();
      console.log(`✅ Project created: ${cp.name}`);
    }
  }

  const prjId1 = 'prj_dentaquik';

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
        assignees: [{ user_id: 'usr_baher', full_name: 'Baher', title: 'Creative Intern' }],
        subtasks: [
          { subtask_id: 'st_1', title: 'Verify primary cyan #06b6d4 contrast ratio', completed: true },
          { subtask_id: 'st_2', title: 'Arabic font pairing with Outfit & Inter', completed: false }
        ],
        created_by: 'usr_baher'
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
        assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor' }],
        subtasks: [
          { subtask_id: 'st_3', title: '10Hz Alpha Waves binaural oscillator', completed: true },
          { subtask_id: 'st_4', title: 'Rain pink noise buffer filter', completed: true }
        ],
        created_by: 'usr_steven'
      },
      {
        task_id: 'tsk_103',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Executive Sign-off on Client Portal & Q4 Enterprise SLA',
        status: 'REVIEW',
        priority: 'HIGH',
        position: '0|h00002:',
        due_date: todayStr,
        duration_minutes: 45,
        assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO' }],
        created_by: 'usr_fady'
      },
      {
        task_id: 'tsk_104',
        workspace_id: wsId,
        project_id: prjId1,
        title: 'Full-stack LexoRank Fractional Indexing Engine for O(1) Reordering',
        status: 'DONE',
        priority: 'MEDIUM',
        position: '0|h00003:',
        duration_minutes: 30,
        assignees: [{ user_id: 'usr_asy', full_name: 'Mohamed Asy', title: 'Dev' }],
        created_by: 'usr_asy'
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
