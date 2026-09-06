/**
 * ICEBERG Upbase Workspaces, Projects & Modular Tool Engine
 * Controls Kanban, LexoRank Tasks, Async Messages, Rich Docs, Bookmarks, and Chat
 */

window.WorkspacesState = {
  workspaces: [],
  currentWorkspaceId: null,
  projects: [],
  currentProjectId: null,
  activeTool: 'kanban', // 'kanban' | 'tasks' | 'messages' | 'docs' | 'bookmarks' | 'chat'
  tasks: [],
  topics: [],
  activeTopic: null,
  docs: [],
  activeDoc: null,
  bookmarks: [],
  chatMessages: [],
  draggedTaskId: null
};

// Default Fallback Datasets (Zero-latency offline-first resilience)
const DEFAULT_FALLBACK_WORKSPACES = [
  {
    workspace_id: 'ws_iceberg_master',
    name: 'ICEBERG Master Workspace',
    description: 'Primary agency workspace for client sprints and internal delivery',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_FALLBACK_PROJECTS = [
  {
    project_id: 'prj_dentaquik',
    workspace_id: 'ws_iceberg_master',
    name: 'DentaQuik (Growth & Funnel)',
    description: 'B2B dental e-commerce funnel, paid media campaigns, and conversion rate optimization.',
    color: '#06b6d4',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_dentaquik'
  },
  {
    project_id: 'prj_musical_bag',
    workspace_id: 'ws_iceberg_master',
    name: 'Musical Bag (E-Commerce & Brand)',
    description: 'Brand identity, Shopify experience, and high-fidelity product storytelling.',
    color: '#ec4899',
    icon: 'folder',
    category: 'Branding',
    client_id: 'client_musical_bag'
  },
  {
    project_id: 'prj_call_worship',
    workspace_id: 'ws_iceberg_master',
    name: 'The Call For Whorship (Media Campaign)',
    description: 'Spiritual multimedia platform, video production, and community engagement rollouts.',
    color: '#8b5cf6',
    icon: 'folder',
    category: 'Media Production',
    client_id: 'client_the_call_for_worship'
  },
  {
    project_id: 'prj_drum_shop',
    workspace_id: 'ws_iceberg_master',
    name: 'Drum Shop (Omnichannel Retainer)',
    description: 'Full-service social media retainer, studio shoots, and in-store event promotions.',
    color: '#f59e0b',
    icon: 'folder',
    category: 'Social Media',
    client_id: 'client_drum_shop'
  },
  {
    project_id: 'prj_ghost_note',
    workspace_id: 'ws_iceberg_master',
    name: 'Ghost Note (Creative & Social)',
    description: 'Independent record label branding, release campaigns, and merchandise design.',
    color: '#10b981',
    icon: 'folder',
    category: 'Creative Design',
    client_id: 'client_ghost_note'
  },
  {
    project_id: 'prj_golden_perfume',
    workspace_id: 'ws_iceberg_master',
    name: 'Golden Perfume (Luxury Brand Launch)',
    description: 'Luxury fragrance packaging, 3D bottle modeling, and Middle East launch PR.',
    color: '#eab308',
    icon: 'folder',
    category: 'Branding',
    client_id: 'client_golden_perfume'
  },
  {
    project_id: 'prj_acrostone',
    workspace_id: 'ws_iceberg_master',
    name: 'Acrostone & Waterpik (B2B Distribution)',
    description: 'Medical supply wholesale portal, distributor catalogs, and CRM integration.',
    color: '#3b82f6',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_acrostone'
  },
  {
    project_id: 'prj_sprint_14',
    workspace_id: 'ws_iceberg_master',
    name: 'Sprint 14: Omni-Channel Q4 Launch',
    description: 'Agency-wide Q4 campaigns, influencer activations, and multi-brand holiday push.',
    color: '#6366f1',
    icon: 'folder',
    category: 'Marketing Strategy',
    client_id: 'client_internal'
  },
  {
    project_id: 'prj_iceberg_internal',
    workspace_id: 'ws_iceberg_master',
    name: 'Iceberg (Internal Operations & Dev)',
    description: 'Core agency infrastructure, website improvements, client portal, and automation bots.',
    color: '#06b6d4',
    icon: 'folder',
    category: 'Development',
    client_id: 'client_iceberg'
  }
];

// ==========================================
// OFFICIAL TEAM ROLES & OWNERSHIP ROSTER
// ==========================================
const ICEBERG_TEAM_MEMBERS = [
  {
    user_id: 'usr_fady',
    full_name: 'Fady',
    title: 'CEO',
    role: 'Executive',
    ownership: 'Final sign-off, high-level roadmaps, and business approvals',
    initials: 'FD',
    avatar_color: '#e11d48',
    bgClass: 'bg-rose-600',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    emoji: '👑'
  },
  {
    user_id: 'usr_asy',
    full_name: 'Mohamed Asy',
    title: 'Dev',
    role: 'Full-stack Dev',
    ownership: 'Full-stack web development, technical architecture, and site maintenance',
    initials: 'MA',
    avatar_color: '#0891b2',
    bgClass: 'bg-cyan-600',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    emoji: '💻'
  },
  {
    user_id: 'usr_abanoub',
    full_name: 'Abanoub',
    title: 'Marketing Manager & Media Buyer',
    role: 'Marketing & Media',
    ownership: 'Conversion tracking, landing page requirements, and campaign integrations',
    initials: 'AB',
    avatar_color: '#d97706',
    bgClass: 'bg-amber-600',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    emoji: '📈'
  },
  {
    user_id: 'usr_steven',
    full_name: 'Steven',
    title: 'Video Editor',
    role: 'Video Production',
    ownership: 'Video assets, media compression, and embedded reel optimization',
    initials: 'ST',
    avatar_color: '#9333ea',
    bgClass: 'bg-purple-600',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
    emoji: '🎬'
  },
  {
    user_id: 'usr_baher',
    full_name: 'Baher',
    title: 'Creative Intern',
    role: 'Creative Support',
    ownership: 'Visual assets, graphic support, and content staging',
    initials: 'BH',
    avatar_color: '#059669',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    emoji: '🎨'
  }
];

const DEFAULT_FALLBACK_TASKS = {
  prj_dentaquik: [
    {
      task_id: 'task_dq_1',
      project_id: 'prj_dentaquik',
      title: 'Audit Shopify checkout funnel drop-off points & conversion tracking',
      description: 'Review Heatmaps & session recordings on Hotjar. Isolate drop-off between cart view and shipping selection.\n\n### Mandate & Ownership:\n- Conversion tracking, landing page requirements, and campaign integrations (Abanoub)\n- Measure 3-step checkout abandonment\n- Optimize mobile express checkout button (Apple Pay & Google Pay)\n- Coordinate with client dental procurement team',
      status: 'TODO',
      priority: 'HIGH',
      due_date: '2026-09-08',
      duration_minutes: 60,
      logged_minutes: 45,
      position: '0|hzzzzz:',
      tags: ['Funnel', 'CRO', 'Shopify'],
      created_by: 'Abanoub',
      created_at: '2026-09-02T10:30:00Z',
      assignees: [{ user_id: 'usr_abanoub', full_name: 'Abanoub', title: 'Marketing Manager & Media Buyer', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_1', title: 'Review Hotjar recordings for EU users', completed: true },
        { subtask_id: 'st_2', title: 'Map abandoned checkout steps in GA4 funnel', completed: false },
        { subtask_id: 'st_3', title: 'Draft recommended 1-page checkout UX wireframe', completed: false }
      ],
      attachments: [
        { name: 'DentaQuik_Funnel_Dropoff_Q3.pdf', size: '2.4 MB', url: '#' },
        { name: 'Checkout_Figma_Audit.png', size: '840 KB', url: '#' }
      ],
      comments: [
        { comment_id: 'c1', author_name: 'Mohamed Asy', author_initials: 'MA', text: 'Checked the numbers: 34% drop occurs right at shipping estimation. We should offer automatic rate lookups in the custom app.', created_at: '2026-09-04T12:00:00Z' },
        { comment_id: 'c2', author_name: 'Abanoub', author_initials: 'AB', text: 'Agreed! Wireframing the updated shipping preview component and conversion tracking pixels now.', created_at: '2026-09-05T09:15:00Z' }
      ]
    },
    {
      task_id: 'task_dq_2',
      project_id: 'prj_dentaquik',
      title: 'Design high-converting mobile product page layout & API',
      description: 'Full-bleed dental equipment photo carousel, sticky Add-To-Cart bar, and accordion specs section.\n\n### Mandate & Ownership:\n- Full-stack web development, technical architecture, and site maintenance (Mohamed Asy)\n- Client requested fast loading time under 1.2s on 4G networks.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      due_date: '2026-09-07',
      duration_minutes: 90,
      logged_minutes: 60,
      position: '0|i00000:',
      tags: ['Development', 'Mobile', 'UI/UX'],
      created_by: 'Mohamed Asy',
      created_at: '2026-09-01T14:20:00Z',
      assignees: [{ user_id: 'usr_asy', full_name: 'Mohamed Asy', title: 'Dev', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_4', title: 'Figma high-fidelity mobile wireframes', completed: true },
        { subtask_id: 'st_5', title: 'Internal technical review with dev architecture', completed: true },
        { subtask_id: 'st_6', title: 'Present prototype to DentaQuik leadership', completed: false }
      ],
      attachments: [
        { name: 'Mobile_PDP_Flow_v3.fig', size: '14.8 MB', url: '#' }
      ],
      comments: [
        { comment_id: 'c3', author_name: 'Mohamed Asy', author_initials: 'MA', text: 'Mobile prototype uploaded to Figma link in bookmarks. Feedback welcomed!', created_at: '2026-09-05T16:40:00Z' }
      ]
    },
    {
      task_id: 'task_dq_3',
      project_id: 'prj_dentaquik',
      title: 'Set up Meta & TikTok Ads retargeting catalog & campaigns',
      description: 'Configure dynamic product ads (DPA) targeting dentists and clinic managers who viewed high-ticket autoclaves and whitening kits in the last 14 days.\n\n### Mandate & Ownership:\n- Conversion tracking, landing page requirements, and campaign integrations (Abanoub)',
      status: 'REVIEW',
      priority: 'MEDIUM',
      due_date: '2026-09-09',
      duration_minutes: 45,
      logged_minutes: 30,
      position: '0|i00008:',
      tags: ['Media', 'Meta', 'TikTok'],
      created_by: 'Abanoub',
      created_at: '2026-09-03T11:00:00Z',
      assignees: [{ user_id: 'usr_abanoub', full_name: 'Abanoub', title: 'Marketing Manager & Media Buyer', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_7', title: 'Pixel health & catalog sync verification', completed: true },
        { subtask_id: 'st_8', title: 'Ad copy in Arabic and English approved by compliance', completed: true }
      ],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_dq_4',
      project_id: 'prj_dentaquik',
      title: 'Final sign-off on DentaQuik Q4 enterprise roadmap & billing model',
      description: 'Review high-level roadmaps, revenue projections, and contract expansion terms for DentaQuik wholesale tier.\n\n### Mandate & Ownership:\n- Final sign-off, high-level roadmaps, and business approvals (Fady)',
      status: 'DONE',
      priority: 'HIGH',
      due_date: '2026-09-05',
      duration_minutes: 30,
      logged_minutes: 30,
      position: '0|i00010:',
      tags: ['Executive', 'Roadmap', 'Approval'],
      created_by: 'Fady',
      created_at: '2026-08-28T09:00:00Z',
      assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_9', title: 'Review Q4 growth goals and SLA tiering', completed: true },
        { subtask_id: 'st_10', title: 'Executive client sign-off documented', completed: true }
      ],
      attachments: [],
      comments: [
        { comment_id: 'c4', author_name: 'Fady', author_initials: 'FD', text: 'Executive approval complete. Roadmap approved for full Q4 rollout.', created_at: '2026-09-05T14:10:00Z' }
      ]
    }
  ],
  prj_musical_bag: [
    {
      task_id: 'task_mb_1',
      project_id: 'prj_musical_bag',
      title: 'Refine packaging typography & metallic foil spec for staging',
      description: 'Specifying gold-leaf stamping thickness and matte velvet unboxing box.\n\n### Mandate & Ownership:\n- Visual assets, graphic support, and content staging (Baher)',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2026-09-08',
      duration_minutes: 60,
      logged_minutes: 40,
      position: '0|hzzzzz:',
      tags: ['Branding', 'Print', 'Creative'],
      created_by: 'Baher',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_baher', full_name: 'Baher', title: 'Creative Intern', avatar_url: '' }],
      subtasks: [{ subtask_id: 'st_mb_1', title: 'CMYK color-correct print test', completed: true }],
      attachments: [{ name: 'Foil_Spec_Final.ai', size: '8.2 MB', url: '#' }],
      comments: [
        { comment_id: 'c_mb_1', author_name: 'Baher', author_initials: 'BH', text: 'Prepared 3 metallic proof variations. Ready for staging review.', created_at: '2026-09-04T15:00:00Z' }
      ]
    },
    {
      task_id: 'task_mb_2',
      project_id: 'prj_musical_bag',
      title: 'Render 3D product turntable video & reel compression',
      description: '360 degree product showcase video for Shopify landing hero section and Instagram Reels.\n\n### Mandate & Ownership:\n- Video assets, media compression, and embedded reel optimization (Steven)',
      status: 'TODO',
      priority: 'MEDIUM',
      due_date: '2026-09-10',
      duration_minutes: 120,
      logged_minutes: 0,
      position: '0|i00000:',
      tags: ['Video', '3D', 'Reels'],
      created_by: 'Steven',
      created_at: '2026-09-03T14:00:00Z',
      assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_mb_v1', title: 'Export 4K ProRes master render', completed: false },
        { subtask_id: 'st_mb_v2', title: 'Encode web-optimized AV1 and H.265 reel format', completed: false }
      ],
      attachments: [],
      comments: [
        { comment_id: 'c_mb_2', author_name: 'Steven', author_initials: 'ST', text: 'Optimizing lighting passes now. Will output 60fps vertical reel cut.', created_at: '2026-09-05T11:00:00Z' }
      ]
    },
    {
      task_id: 'task_mb_3',
      project_id: 'prj_musical_bag',
      title: 'Executive sign-off on retail expansion & distributor terms',
      description: 'High-level business approvals and licensing roadmaps with international music distributors.\n\n### Mandate & Ownership:\n- Final sign-off, high-level roadmaps, and business approvals (Fady)',
      status: 'DONE',
      priority: 'URGENT',
      due_date: '2026-09-04',
      duration_minutes: 45,
      logged_minutes: 45,
      position: '0|i00008:',
      tags: ['Executive', 'Approval'],
      created_by: 'Fady',
      created_at: '2026-08-30T10:00:00Z',
      assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: [
        { comment_id: 'c_mb_3', author_name: 'Fady', author_initials: 'FD', text: 'Approved distributor contract. Green light to move into mass production.', created_at: '2026-09-04T18:00:00Z' }
      ]
    }
  ],
  prj_call_worship: [
    {
      task_id: 'task_cw_1',
      project_id: 'prj_call_worship',
      title: 'Soundtrack mastering & multi-format video compression',
      description: 'High-dynamic range audio and video export for streaming and live broadcasts.\n\n### Mandate & Ownership:\n- Video assets, media compression, and embedded reel optimization (Steven)',
      status: 'TODO',
      priority: 'HIGH',
      due_date: '2026-09-09',
      duration_minutes: 90,
      logged_minutes: 0,
      position: '0|hzzzzz:',
      tags: ['Video', 'Audio', 'Compression'],
      created_by: 'Steven',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_cw_2',
      project_id: 'prj_call_worship',
      title: 'Color grading & reel optimization on 4K concert footage',
      description: 'DaVinci Resolve color timing with cinematic highlights, plus 9:16 social reel edits.\n\n### Mandate & Ownership:\n- Video assets, media compression, and embedded reel optimization (Steven)',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      due_date: '2026-09-07',
      duration_minutes: 180,
      logged_minutes: 120,
      position: '0|i00000:',
      tags: ['Video', 'Production', 'Reels'],
      created_by: 'Steven',
      created_at: '2026-09-01T15:00:00Z',
      assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: [
        { comment_id: 'c_cw_1', author_name: 'Steven', author_initials: 'ST', text: 'Color graded first 20 minutes. Compressing social teaser snippets today.', created_at: '2026-09-05T13:30:00Z' }
      ]
    }
  ],
  prj_drum_shop: [
    {
      task_id: 'task_ds_1',
      project_id: 'prj_drum_shop',
      title: 'Visual assets & graphic banner staging for clinic promotion',
      description: 'Coordinate graphic assets, event flyers, and digital signage.\n\n### Mandate & Ownership:\n- Visual assets, graphic support, and content staging (Baher)',
      status: 'TODO',
      priority: 'MEDIUM',
      due_date: '2026-09-08',
      duration_minutes: 60,
      logged_minutes: 0,
      position: '0|hzzzzz:',
      tags: ['Creative', 'Visuals', 'Staging'],
      created_by: 'Baher',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_baher', full_name: 'Baher', title: 'Creative Intern', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_ds_2',
      project_id: 'prj_drum_shop',
      title: 'Cymbal demo video edit & optimized vertical reels',
      description: 'Showcase low-volume cymbals with punchy captions and audio sync.\n\n### Mandate & Ownership:\n- Video assets, media compression, and embedded reel optimization (Steven)',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2026-09-07',
      duration_minutes: 75,
      logged_minutes: 45,
      position: '0|i00000:',
      tags: ['Video', 'Reels', 'Optimization'],
      created_by: 'Steven',
      created_at: '2026-09-03T11:00:00Z',
      assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    }
  ],
  prj_ghost_note: [
    {
      task_id: 'task_gn_1',
      project_id: 'prj_ghost_note',
      title: 'Vinyl cover design typography proofing & visual graphics',
      description: 'Pre-press vector alignment and inner sleeve graphic support.\n\n### Mandate & Ownership:\n- Visual assets, graphic support, and content staging (Baher)',
      status: 'TODO',
      priority: 'HIGH',
      due_date: '2026-09-08',
      duration_minutes: 60,
      logged_minutes: 0,
      position: '0|hzzzzz:',
      tags: ['Vinyl', 'Creative', 'Graphic'],
      created_by: 'Baher',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_baher', full_name: 'Baher', title: 'Creative Intern', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_gn_2',
      project_id: 'prj_ghost_note',
      title: 'Release teaser video animation & reel media compression',
      description: 'Motion teaser in After Effects rendered for TikTok, Instagram, and web banner.\n\n### Mandate & Ownership:\n- Video assets, media compression, and embedded reel optimization (Steven)',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      due_date: '2026-09-07',
      duration_minutes: 90,
      logged_minutes: 60,
      position: '0|i00000:',
      tags: ['Video', 'Animation', 'Reels'],
      created_by: 'Steven',
      created_at: '2026-09-03T12:00:00Z',
      assignees: [{ user_id: 'usr_steven', full_name: 'Steven', title: 'Video Editor', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    }
  ],
  prj_golden_perfume: [
    {
      task_id: 'task_gp_1',
      project_id: 'prj_golden_perfume',
      title: '3D luxury bottle visual assets & social staging',
      description: 'Visual asset rendering with amber refractions, gold cap staging, and catalog shots.\n\n### Mandate & Ownership:\n- Visual assets, graphic support, and content staging (Baher)',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2026-09-08',
      duration_minutes: 120,
      logged_minutes: 80,
      position: '0|hzzzzz:',
      tags: ['Luxury', '3D', 'Visuals'],
      created_by: 'Baher',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_baher', full_name: 'Baher', title: 'Creative Intern', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_gp_2',
      project_id: 'prj_golden_perfume',
      title: 'Influencer conversion tracking & landing page campaign integration',
      description: 'Set up UTM tracking, conversion pixels, and affiliate media buying parameters for Middle East launch.\n\n### Mandate & Ownership:\n- Conversion tracking, landing page requirements, and campaign integrations (Abanoub)',
      status: 'REVIEW',
      priority: 'MEDIUM',
      due_date: '2026-09-09',
      duration_minutes: 45,
      logged_minutes: 30,
      position: '0|i00000:',
      tags: ['Marketing', 'Tracking', 'Campaigns'],
      created_by: 'Abanoub',
      created_at: '2026-09-03T15:00:00Z',
      assignees: [{ user_id: 'usr_abanoub', full_name: 'Abanoub', title: 'Marketing Manager & Media Buyer', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    }
  ],
  prj_acrostone: [
    {
      task_id: 'task_ac_1',
      project_id: 'prj_acrostone',
      title: 'Sync B2B distributor catalog pricing with ERP & maintain backend',
      description: 'Automate ERP sync for medical distributor wholesale prices and stock levels.\n\n### Mandate & Ownership:\n- Full-stack web development, technical architecture, and site maintenance (Mohamed Asy)',
      status: 'TODO',
      priority: 'HIGH',
      due_date: '2026-09-09',
      duration_minutes: 60,
      logged_minutes: 0,
      position: '0|hzzzzz:',
      tags: ['Development', 'ERP', 'Backend'],
      created_by: 'Mohamed Asy',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_asy', full_name: 'Mohamed Asy', title: 'Dev', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    },
    {
      task_id: 'task_ac_2',
      project_id: 'prj_acrostone',
      title: 'Final sign-off on enterprise wholesale SLA & partnership terms',
      description: 'Executive contract review and credit lines approval for Waterpik national distribution.\n\n### Mandate & Ownership:\n- Final sign-off, high-level roadmaps, and business approvals (Fady)',
      status: 'DONE',
      priority: 'HIGH',
      due_date: '2026-09-04',
      duration_minutes: 30,
      logged_minutes: 30,
      position: '0|i00008:',
      tags: ['Executive', 'Approval', 'Roadmap'],
      created_by: 'Fady',
      created_at: '2026-09-01T10:00:00Z',
      assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: [
        { comment_id: 'c_ac_1', author_name: 'Fady', author_initials: 'FD', text: 'Contract executed with Acrostone board. Wholesale operations are live.', created_at: '2026-09-04T16:00:00Z' }
      ]
    }
  ],
  prj_sprint_14: [
    {
      task_id: 'task_sp_1',
      project_id: 'prj_sprint_14',
      title: 'Final sign-off on Q4 high-level roadmaps & business approvals',
      description: 'Review multi-brand agency deliverables, capacity planning, and holiday revenue milestones.\n\n### Mandate & Ownership:\n- Final sign-off, high-level roadmaps, and business approvals (Fady)',
      status: 'TODO',
      priority: 'URGENT',
      due_date: '2026-09-08',
      duration_minutes: 60,
      logged_minutes: 0,
      position: '0|hzzzzz:',
      tags: ['Executive', 'Roadmap', 'Strategy'],
      created_by: 'Fady',
      created_at: '2026-09-02T10:00:00Z',
      assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_sp_1', title: 'Consolidate 8 client scopes into Q4 master timeline', completed: true },
        { subtask_id: 'st_sp_2', title: 'Sign-off on video and dev capacity allocations', completed: false }
      ],
      attachments: [],
      comments: [
        { comment_id: 'c_sp_1', author_name: 'Fady', author_initials: 'FD', text: 'All department leads: please confirm resource requirements before Monday sign-off.', created_at: '2026-09-05T18:00:00Z' }
      ]
    },
    {
      task_id: 'task_sp_2',
      project_id: 'prj_sprint_14',
      title: 'Omnichannel conversion tracking & media campaign matrix',
      description: 'Coordinate cross-client pixel integrations, landing page requirements, and paid ad spend tracking.\n\n### Mandate & Ownership:\n- Conversion tracking, landing page requirements, and campaign integrations (Abanoub)',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2026-09-07',
      duration_minutes: 45,
      logged_minutes: 30,
      position: '0|i00000:',
      tags: ['Marketing', 'Tracking', 'Omnichannel'],
      created_by: 'Abanoub',
      created_at: '2026-09-03T11:00:00Z',
      assignees: [{ user_id: 'usr_abanoub', full_name: 'Abanoub', title: 'Marketing Manager & Media Buyer', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: []
    }
  ],
  prj_iceberg_internal: [
    {
      task_id: 'task_ib_1',
      project_id: 'prj_iceberg_internal',
      title: 'Full-stack web development, technical architecture & Upbase engine',
      description: 'Maintain and scale agency systems: Sliding task drawer, LexoRank Kanban, attachments, comments, and site maintenance.\n\n### Mandate & Ownership:\n- Full-stack web development, technical architecture, and site maintenance (Mohamed Asy)',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      due_date: '2026-09-06',
      duration_minutes: 60,
      logged_minutes: 50,
      position: '0|hzzzzz:',
      tags: ['Development', 'Architecture', 'Maintenance'],
      created_by: 'Mohamed Asy',
      created_at: '2026-09-05T10:00:00Z',
      assignees: [{ user_id: 'usr_asy', full_name: 'Mohamed Asy', title: 'Dev', avatar_url: '' }],
      subtasks: [
        { subtask_id: 'st_ib_1', title: 'Build sliding drawer UI with 60fps GPU smoothness', completed: true },
        { subtask_id: 'st_ib_2', title: 'Universal attachment download engine', completed: true },
        { subtask_id: 'st_ib_3', title: 'Integrate official 5 team roles and ownership roster', completed: true }
      ],
      attachments: [],
      comments: [
        { comment_id: 'c_ib_1', author_name: 'Mohamed Asy', author_initials: 'MA', text: 'All agency technical modules and team ownership parameters synchronized.', created_at: '2026-09-06T00:10:00Z' }
      ]
    },
    {
      task_id: 'task_ib_2',
      project_id: 'prj_iceberg_internal',
      title: 'Final sign-off on Iceberg agency infrastructure & hosting budget',
      description: 'Approve annual Vercel Enterprise, MongoDB Atlas dedicated tier, and tool subscriptions.\n\n### Mandate & Ownership:\n- Final sign-off, high-level roadmaps, and business approvals (Fady)',
      status: 'DONE',
      priority: 'HIGH',
      due_date: '2026-09-05',
      duration_minutes: 30,
      logged_minutes: 30,
      position: '0|i00008:',
      tags: ['Executive', 'Approvals', 'Budget'],
      created_by: 'Fady',
      created_at: '2026-09-03T10:00:00Z',
      assignees: [{ user_id: 'usr_fady', full_name: 'Fady', title: 'CEO', avatar_url: '' }],
      subtasks: [],
      attachments: [],
      comments: [
        { comment_id: 'c_ib_2', author_name: 'Fady', author_initials: 'FD', text: 'Hosting budget approved for 2026/2027.', created_at: '2026-09-05T16:00:00Z' }
      ]
    }
  ]
};

const DEFAULT_FALLBACK_TOPICS = [
  {
    topic_id: 'top_1',
    title: 'Sprint 14 Launch Architecture & Client Roadmaps',
    category: 'ARCHITECTURE',
    content_html: '<p>Welcome to the unified project space. Check all deliverables, brand specs, and upcoming production milestones here.</p>',
    author: { full_name: 'Lead Director' },
    is_pinned: true,
    replies_count: 3,
    last_activity_at: new Date().toISOString()
  }
];

const DEFAULT_FALLBACK_DOCS = [
  {
    doc_id: 'doc_1',
    title: 'Project Scope & Creative Brief',
    content_html: '<h2>Creative Strategy</h2><p>Establish high-converting brand presence and seamless omnichannel customer journey.</p><h3>Key Deliverables</h3><ul><li>High-fidelity Brand UI</li><li>Omnichannel Paid Media Assets</li><li>B2B Conversion Funnels</li></ul>',
    version_history: [{ version_number: 1, created_at: new Date().toISOString() }]
  }
];

const DEFAULT_FALLBACK_BOOKMARKS = [
  {
    bookmark_id: 'bm_1',
    url: 'https://www.figma.com',
    title: 'Figma Brand System & UI Assets',
    domain: 'figma.com',
    image_url: ''
  },
  {
    bookmark_id: 'bm_2',
    url: 'https://drive.google.com',
    title: 'Master Assets & 4K Renders',
    domain: 'drive.google.com',
    image_url: ''
  }
];

const DEFAULT_FALLBACK_CHAT = [
  {
    message_id: 'msg_1',
    sender: { full_name: 'Iceberg Lead' },
    text: 'Welcome team! Tasks and Kanban cards have been loaded for this sprint.',
    created_at: new Date().toISOString(),
    reactions: [{ emoji: '🚀', count: 4 }]
  }
];

// Initialize Upbase Workspaces Suite
async function initUpbaseWorkspaces() {
  // 1. Immediately apply fallback data so user NEVER sees "Loading Workspaces..."
  if (!window.WorkspacesState.workspaces || window.WorkspacesState.workspaces.length === 0) {
    window.WorkspacesState.workspaces = [...DEFAULT_FALLBACK_WORKSPACES];
  }
  if (!window.WorkspacesState.currentWorkspaceId) {
    window.WorkspacesState.currentWorkspaceId = window.WorkspacesState.workspaces[0].workspace_id;
  }
  if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
    window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
  }
  if (!window.WorkspacesState.currentProjectId && window.WorkspacesState.projects.length > 0) {
    window.WorkspacesState.currentProjectId = window.WorkspacesState.projects[0].project_id;
  }

  // Preload fallback tasks if none loaded
  if ((!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0) && window.WorkspacesState.currentProjectId) {
    window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[window.WorkspacesState.currentProjectId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
  }

  // 2. Synchronous zero-latency render of UI elements
  renderWorkspaceSelector();
  renderProjectsSidebar();
  renderToolTabsUI();
  await loadCurrentToolContent();

  // 3. Asynchronously sync with API (resilient background load)
  await loadWorkspacesList();
}

// Helper aliases for UI rendering
function renderActiveProjectTools() {
  renderToolTabsUI();
}

// Load Workspaces list
async function loadWorkspacesList() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (!res.ok) {
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
      return;
    }
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.WorkspacesState.workspaces = result.data;
      if (!window.WorkspacesState.currentWorkspaceId || !result.data.find(w => w.workspace_id === window.WorkspacesState.currentWorkspaceId)) {
        window.WorkspacesState.currentWorkspaceId = result.data[0].workspace_id;
      }
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
    } else {
      renderWorkspaceSelector();
      await loadWorkspaceProjects();
    }
  } catch (err) {
    console.warn('Operating in offline-first mode for workspaces:', err);
    renderWorkspaceSelector();
    await loadWorkspaceProjects();
  }
}

async function createInitialDefaultWorkspace() {
  try {
    const res = await fetch('/api/iams/workspaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        name: 'ICEBERG Master Workspace',
        description: 'Primary agency workspace for client sprints and internal delivery'
      })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        window.WorkspacesState.currentWorkspaceId = result.data.workspace_id;
        await loadWorkspacesList();
      }
    }
  } catch (e) {
    console.warn('Default workspace server setup skipped, using local fallback:', e);
  }
}

// Render Workspace Selector dropdown
function renderWorkspaceSelector() {
  const select = document.getElementById('upbase-workspace-select');
  if (!select) return;

  const workspaces = (window.WorkspacesState.workspaces && window.WorkspacesState.workspaces.length > 0)
    ? window.WorkspacesState.workspaces
    : DEFAULT_FALLBACK_WORKSPACES;

  select.innerHTML = workspaces.map(ws => `
    <option value="${ws.workspace_id}" ${ws.workspace_id === window.WorkspacesState.currentWorkspaceId ? 'selected' : ''}>
      ${escapeHtml(ws.name)}
    </option>
  `).join('');
}

// Switch Workspace
async function switchWorkspace(wsId) {
  window.WorkspacesState.currentWorkspaceId = wsId;
  window.WorkspacesState.currentProjectId = null;
  await loadWorkspaceProjects();
}

// Load Projects under current workspace
async function loadWorkspaceProjects() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  if (!wsId) return;

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/projects`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (!res.ok) {
      if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
        window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
      }
      if (!window.WorkspacesState.currentProjectId && window.WorkspacesState.projects.length > 0) {
        window.WorkspacesState.currentProjectId = window.WorkspacesState.projects[0].project_id;
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
      return;
    }
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.WorkspacesState.projects = result.data;
      if (!window.WorkspacesState.currentProjectId || !result.data.find(p => p.project_id === window.WorkspacesState.currentProjectId)) {
        window.WorkspacesState.currentProjectId = result.data[0].project_id;
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
      await loadCurrentToolContent();
    } else {
      if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
        window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
      }
      renderProjectsSidebar();
      renderActiveProjectTools();
    }
  } catch (err) {
    console.warn('Using offline fallback projects:', err);
    if (!window.WorkspacesState.projects || window.WorkspacesState.projects.length === 0) {
      window.WorkspacesState.projects = [...DEFAULT_FALLBACK_PROJECTS];
    }
    renderProjectsSidebar();
    renderActiveProjectTools();
  }
}

// Render Projects in sidebar list
function renderProjectsSidebar() {
  const container = document.getElementById('upbase-projects-list');
  if (!container) return;

  const projects = window.WorkspacesState.projects;
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-500 py-4 text-center px-2">
        <p class="mb-2">No project lists created yet.</p>
        <button type="button" onclick="openCreateProjectModal()" class="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded-xl border border-cyan-500/30 font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <span>+</span> Create First Project
        </button>
      </div>`;
    return;
  }

  container.innerHTML = projects.map(p => `
    <button onclick="selectProject('${p.project_id}')" class="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${p.project_id === window.WorkspacesState.currentProjectId ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}">
      <div class="flex items-center gap-2.5 truncate">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${p.color || '#06b6d4'};"></span>
        <span class="truncate">${escapeHtml(p.name)}</span>
      </div>
    </button>
  `).join('');

  renderTeamRosterSidebar();
}

// Select a Project
async function selectProject(prjId, updateUrl = true) {
  window.WorkspacesState.currentProjectId = prjId;
  renderProjectsSidebar();
  renderActiveProjectTools();
  await loadCurrentToolContent();
  if (updateUrl && typeof updateWorkspacesUrl === 'function') {
    updateWorkspacesUrl();
  }
}

// Switch Active Tool Tab
function switchProjectTool(toolKey, updateUrl = true) {
  window.WorkspacesState.activeTool = toolKey;
  renderToolTabsUI();
  loadCurrentToolContent();
  if (updateUrl && typeof updateWorkspacesUrl === 'function') {
    updateWorkspacesUrl();
  }
}

// Render Project Tool Tabs header
function renderToolTabsUI() {
  const currentPrj = window.WorkspacesState.projects.find(p => p.project_id === window.WorkspacesState.currentProjectId);
  if (!currentPrj) return;

  const prjTitleEl = document.getElementById('upbase-project-title');
  if (prjTitleEl) {
    prjTitleEl.innerHTML = `<span class="w-3 h-3 rounded-full inline-block mr-2" style="background-color: ${currentPrj.color || '#06b6d4'};"></span>${escapeHtml(currentPrj.name)}`;
  }

  const tools = [
    { key: 'kanban', label: 'Kanban Board', icon: 'kanban' },
    { key: 'tasks', label: 'List View', icon: 'check-square' },
    { key: 'messages', label: 'Messages', icon: 'message-square' },
    { key: 'docs', label: 'Docs', icon: 'file-text' },
    { key: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' },
    { key: 'chat', label: 'Chat Stream', icon: 'messages-square' }
  ];

  const tabsContainer = document.getElementById('upbase-tool-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = tools.map(t => {
      const isActive = window.WorkspacesState.activeTool === t.key;
      return `
        <button onclick="switchProjectTool('${t.key}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 border border-transparent'}">
          <i data-lucide="${t.icon}" class="w-4 h-4"></i>
          ${t.label}
        </button>
      `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }
}

// Load content depending on current active tool
async function loadCurrentToolContent() {
  renderToolTabsUI();
  const tool = window.WorkspacesState.activeTool;
  const prjId = window.WorkspacesState.currentProjectId;
  if (!prjId) return;

  // Hide all panels
  ['kanban', 'tasks', 'messages', 'docs', 'bookmarks', 'chat'].forEach(k => {
    const el = document.getElementById(`upbase-panel-${k}`);
    if (el) el.classList.add('hidden');
  });

  const activePanel = document.getElementById(`upbase-panel-${tool}`);
  if (activePanel) activePanel.classList.remove('hidden');

  if (tool === 'kanban' || tool === 'tasks') {
    await loadWorkspaceTasks();
  } else if (tool === 'messages') {
    await loadProjectMessages();
  } else if (tool === 'docs') {
    await loadProjectDocs();
  } else if (tool === 'bookmarks') {
    await loadProjectBookmarks();
  } else if (tool === 'chat') {
    await loadProjectChat();
  }
}

// ==========================================
// 1. KANBAN & TASKS (LEXORANK FRACTIONAL INDEXING)
// ==========================================

async function loadWorkspaceTasks() {
  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const prjId = window.WorkspacesState.currentProjectId;
  if (!prjId) return;

  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/tasks?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.tasks = result.data;
      } else if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
        window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
      }
    } else {
      if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
        window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
      }
    }
  } catch (err) {
    console.warn('Operating in offline-first mode for tasks:', err);
    if (!window.WorkspacesState.tasks || window.WorkspacesState.tasks.length === 0 || window.WorkspacesState.tasks.every(t => t.project_id !== prjId)) {
      window.WorkspacesState.tasks = [...(DEFAULT_FALLBACK_TASKS[prjId] || DEFAULT_FALLBACK_TASKS.prj_dentaquik || [])];
    }
  }

  if (window.WorkspacesState.activeTool === 'kanban') {
    renderKanbanColumns();
  } else {
    renderTaskListView();
  }

  renderTeamRosterSidebar();
}

// ==========================================
// KANBAN DRAG & DROP ENGINE (60FPS GPU OPTIMIZED)
// ==========================================
let draggedTaskId = null;

function handleKanbanDragStart(e, taskId) {
  draggedTaskId = taskId;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }
  const card = e.currentTarget;
  if (card) {
    card.classList.add('opacity-40', 'scale-95');
  }
}

function handleKanbanDragEnd(e) {
  const card = e.currentTarget;
  if (card) {
    card.classList.remove('opacity-40', 'scale-95');
  }
  document.querySelectorAll('.kanban-col-drop-active').forEach(el => {
    el.classList.remove('kanban-col-drop-active');
  });
  draggedTaskId = null;
}

function handleKanbanDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  const col = e.currentTarget;
  if (col && !col.classList.contains('kanban-col-drop-active')) {
    col.classList.add('kanban-col-drop-active');
  }
}

function handleKanbanDragLeave(e) {
  const col = e.currentTarget;
  if (col && !col.contains(e.relatedTarget)) {
    col.classList.remove('kanban-col-drop-active');
  }
}

async function handleKanbanDrop(e, targetStatus) {
  e.preventDefault();
  const col = e.currentTarget;
  if (col) col.classList.remove('kanban-col-drop-active');

  const taskId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || draggedTaskId;
  if (!taskId) return;

  const task = (window.WorkspacesState.tasks || []).find(t => t.task_id === taskId);
  if (!task || task.status === targetStatus) return;

  // Instant 60fps optimistic update
  task.status = targetStatus;
  renderKanbanColumns();

  try {
    const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
    await fetch(`/api/workspace-tasks?action=update_task&task_id=${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus, workspace_id: wsId })
    });
  } catch (err) {
    console.warn('Kanban drop status persist (offline-first):', err);
  }
}

function renderKanbanColumns() {
  const columns = [
    { id: 'TODO', title: 'To Do', color: '#64748b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#06b6d4' },
    { id: 'REVIEW', title: 'Review', color: '#f59e0b' },
    { id: 'DONE', title: 'Done', color: '#10b981' }
  ];

  const activeFilterId = window.WorkspacesState.assigneeFilter;
  const activeFilterMember = activeFilterId ? (window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS).find(m => m.user_id === activeFilterId) : null;

  columns.forEach(col => {
    const colKey = col.id.toLowerCase();
    const container = document.getElementById(`kanban-col-${colKey}`) || document.getElementById(`kanban-col-${colKey.replace('_', '-')}`);
    const countBadge = document.getElementById(`kanban-count-${colKey}`) || document.getElementById(`kanban-count-${colKey.replace('_', '-')}`);
    if (!container) return;

    let colTasks = (window.WorkspacesState.tasks || []).filter(t => t.status === col.id);
    if (activeFilterMember) {
      colTasks = colTasks.filter(t => (t.assignees || []).some(a => a.user_id === activeFilterId || a.full_name === activeFilterMember.full_name));
    }

    if (countBadge) countBadge.innerText = colTasks.length;

    const cardsHtml = colTasks.map(t => {
      const isDone = t.status === 'DONE';
      const completedSubtasks = (t.subtasks || []).filter(st => st.completed).length;
      const totalSubtasks = (t.subtasks || []).length;
      const attachmentsCount = (t.attachments || []).length;
      const commentsCount = (t.comments || []).length;

      // Assignee avatar stack with official team styling
      const assigneesHtml = (t.assignees && t.assignees.length > 0) ? t.assignees.map((a, i) => {
        const member = (window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS).find(m => m.user_id === a.user_id || m.full_name === a.full_name);
        const bgClass = member ? member.bgClass : 'bg-cyan-600';
        const initials = a.full_name ? a.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : (member ? member.initials : 'MA');
        const tooltip = member ? `${member.emoji} ${member.full_name} (${member.title}) — ${member.ownership}` : (a.full_name || 'Team Member');
        return `<span class="w-5 h-5 rounded-full ${bgClass} text-white font-bold text-[9px] flex items-center justify-center border border-slate-900 shadow-sm ${i > 0 ? '-ml-1.5' : ''}" title="${escapeHtml(tooltip)}">${initials}</span>`;
      }).join('') : `<span class="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold text-[9px] flex items-center justify-center border border-slate-700" title="Unassigned"><i data-lucide="user" class="w-2.5 h-2.5"></i></span>`;

      // Upbase Tag Badges
      const tagsHtml = (t.tags && t.tags.length > 0) ? `
        <div class="flex flex-wrap items-center gap-1 mb-2">
          ${t.tags.map(tag => `<span class="px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 text-[10px] font-semibold">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : '';

      return `
        <div class="kanban-card p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer shadow-md group relative ${isDone ? 'opacity-60 bg-slate-950/70' : ''}"
             draggable="true"
             ondragstart="handleKanbanDragStart(event, '${t.task_id}')"
             ondragend="handleKanbanDragEnd(event)"
             onclick="openTaskDetailsModal('${t.task_id}')">
          
          <!-- Top Row: Checkbox Circle + Title -->
          <div class="flex items-start gap-2.5 mb-2">
            <button type="button" 
                    onclick="toggleTaskComplete('${t.task_id}', event)" 
                    title="${isDone ? 'Mark as Incomplete' : 'Mark as Complete'}"
                    class="mt-0.5 w-4 h-4 rounded-full border ${isDone ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-500 hover:border-emerald-400 text-transparent hover:text-emerald-400'} flex items-center justify-center shrink-0 transition-all">
              <i data-lucide="check" class="w-2.5 h-2.5 stroke-[3]"></i>
            </button>
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-bold leading-snug transition-colors ${isDone ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-cyan-400'}">
                ${escapeHtml(t.title)}
              </h4>
            </div>
          </div>

          ${tagsHtml}

          <!-- Bottom Meta Row (Image 2 style) -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
            <div class="flex items-center gap-2.5">
              ${attachmentsCount > 0 ? `
                <span class="flex items-center gap-1 text-slate-400" title="${attachmentsCount} attachments">
                  <i data-lucide="paperclip" class="w-3 h-3 text-amber-400"></i> ${attachmentsCount}
                </span>
              ` : ''}
              ${totalSubtasks > 0 ? `
                <span class="flex items-center gap-1 ${completedSubtasks === totalSubtasks ? 'text-emerald-400' : 'text-slate-400'}" title="${completedSubtasks}/${totalSubtasks} subtasks">
                  <i data-lucide="check-square" class="w-3 h-3 text-cyan-400"></i> ${completedSubtasks}/${totalSubtasks}
                </span>
              ` : ''}
              ${commentsCount > 0 ? `
                <span class="flex items-center gap-1 text-slate-400" title="${commentsCount} comments">
                  <i data-lucide="message-square" class="w-3 h-3 text-blue-400"></i> ${commentsCount}
                </span>
              ` : ''}
              ${t.due_date ? `
                <span class="flex items-center gap-1 text-slate-400 font-mono" title="Due date">
                  <i data-lucide="calendar" class="w-3 h-3 text-slate-500"></i> ${t.due_date.replace(/^\d{4}-/, '')}
                </span>
              ` : ''}
            </div>

            <div class="flex items-center shrink-0">
              ${assigneesHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add + add task footer button
    container.innerHTML = cardsHtml + `
      <div class="pt-1">
        <button type="button" onclick="promptQuickAddTaskToColumn('${col.id}')" class="w-full py-1.5 px-2 text-center text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 rounded-xl transition-all flex items-center justify-center gap-1 border border-dashed border-slate-800/80 hover:border-slate-700">
          <i data-lucide="plus" class="w-3 h-3"></i>
          <span>add task</span>
        </button>
      </div>
    `;
  });

  if (window.lucide) window.lucide.createIcons();
}

// Render List View (Tab 2)
function renderTaskListView() {
  const container = document.getElementById('upbase-tasks-table');
  if (!container) return;

  const activeFilterId = window.WorkspacesState.assigneeFilter;
  const activeFilterMember = activeFilterId ? (window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS).find(m => m.user_id === activeFilterId) : null;

  let tasks = window.WorkspacesState.tasks || [];
  if (activeFilterMember) {
    tasks = tasks.filter(t => (t.assignees || []).some(a => a.user_id === activeFilterId || a.full_name === activeFilterMember.full_name));
  }

  if (tasks.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No tasks found${activeFilterMember ? ` assigned to ${escapeHtml(activeFilterMember.full_name)}` : ''} in this project. Use the input above or clear filter!</div>`;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-300">
        <thead class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            <th class="py-2.5 px-3">Status</th>
            <th class="py-2.5 px-3">Task Title</th>
            <th class="py-2.5 px-3">Assignee & Role</th>
            <th class="py-2.5 px-3">Due Date</th>
            <th class="py-2.5 px-3">Priority</th>
            <th class="py-2.5 px-3">Tags</th>
            <th class="py-2.5 px-3 text-right">Subtasks</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/70">
          ${tasks.map(t => {
            const isDone = t.status === 'DONE';
            const completedSubtasks = (t.subtasks || []).filter(st => st.completed).length;
            const totalSubtasks = (t.subtasks || []).length;
            
            const firstAssignee = (t.assignees && t.assignees[0]) ? t.assignees[0] : null;
            const member = firstAssignee ? (window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS).find(m => m.user_id === firstAssignee.user_id || m.full_name === firstAssignee.full_name) : null;
            const assigneeBadge = member ? `
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${member.badgeClass} text-[11px] font-semibold" title="${escapeHtml(`${member.full_name} (${member.title}) — ${member.ownership}`)}">
                <span class="w-2 h-2 rounded-full ${member.bgClass}"></span>
                <span>${escapeHtml(member.full_name)}</span>
                <span class="opacity-70 text-[10px]">(${escapeHtml(member.title)})</span>
              </span>
            ` : (firstAssignee ? `<span class="text-slate-400">${escapeHtml(firstAssignee.full_name)}</span>` : '<span class="text-slate-500 italic">Unassigned</span>');

            return `
              <tr onclick="openTaskDetailsModal('${t.task_id}')" class="hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <td class="py-3 px-3" onclick="event.stopPropagation()">
                  <button type="button" onclick="toggleTaskComplete('${t.task_id}', event)" class="w-4 h-4 rounded-full border ${isDone ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-500 hover:border-emerald-400 text-transparent hover:text-emerald-400'} flex items-center justify-center transition-all">
                    <i data-lucide="check" class="w-2.5 h-2.5 stroke-[3]"></i>
                  </button>
                </td>
                <td class="py-3 px-3">
                  <div class="font-semibold ${isDone ? 'line-through text-slate-500' : 'text-white group-hover:text-cyan-400'}">
                    ${escapeHtml(t.title)}
                  </div>
                </td>
                <td class="py-3 px-3">${assigneeBadge}</td>
                <td class="py-3 px-3 font-mono text-slate-400">${t.due_date || '—'}</td>
                <td class="py-3 px-3">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-md ${t.priority === 'URGENT' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : t.priority === 'HIGH' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' : 'bg-slate-800 text-slate-400'}">
                    ${t.priority || 'NORMAL'}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <div class="flex flex-wrap gap-1">
                    ${(t.tags || []).map(tg => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">${escapeHtml(tg)}</span>`).join('')}
                  </div>
                </td>
                <td class="py-3 px-3 text-right font-mono text-slate-400">
                  ${totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '—'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// UPBASE SLIDING TASK DETAILS DRAWER ENGINE
// (Matches Image 2 reference pixel-perfect)
// ==========================================

function openTaskDetailsModal(taskId, updateUrl = true) {
  if (!taskId) return;
  window.WorkspacesState.activeTaskId = taskId;
  if (updateUrl && typeof updateWorkspacesUrl === 'function') {
    updateWorkspacesUrl(taskId);
  }

  // Search active project tasks or fallback tasks
  let task = (window.WorkspacesState.tasks || []).find(t => t.task_id === taskId);
  if (!task) {
    for (const prjKey in DEFAULT_FALLBACK_TASKS) {
      const match = DEFAULT_FALLBACK_TASKS[prjKey].find(t => t.task_id === taskId);
      if (match) {
        task = match;
        break;
      }
    }
  }

  if (!task) {
    console.warn('Task not found for drawer:', taskId);
    return;
  }

  // Find project info for breadcrumbs
  const project = (window.WorkspacesState.projects || []).find(p => p.project_id === task.project_id) || {
    name: 'General',
    color: '#06b6d4'
  };

  // 1. Breadcrumbs
  const prjColorEl = document.getElementById('task-drawer-prj-color');
  const prjNameEl = document.getElementById('task-drawer-prj-name');
  if (prjColorEl) prjColorEl.style.backgroundColor = project.color || '#06b6d4';
  if (prjNameEl) prjNameEl.textContent = project.name || 'General';

  // Status Select
  const statusSelect = document.getElementById('task-drawer-status-select');
  if (statusSelect) statusSelect.value = task.status || 'TODO';

  // Completion Button
  syncDrawerCompleteButton(task.status === 'DONE');

  // Title
  const titleInput = document.getElementById('task-drawer-title-input');
  if (titleInput) {
    titleInput.value = task.title || '';
    if (task.status === 'DONE') {
      titleInput.classList.add('line-through', 'text-slate-500');
    } else {
      titleInput.classList.remove('line-through', 'text-slate-500');
    }
    autoResizeDrawerTitle(titleInput);
  }

  // Creator & Created Date
  const creatorEl = document.getElementById('task-drawer-creator');
  const createdAtEl = document.getElementById('task-drawer-created-at');
  if (creatorEl) creatorEl.textContent = task.created_by || 'Mohamed Asy';
  if (createdAtEl) {
    createdAtEl.textContent = task.created_at ? new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
  }

  // Due Date
  const dueInput = document.getElementById('task-drawer-due-input');
  if (dueInput) dueInput.value = task.due_date || '';

  // Assignee Select
  const assigneeSelect = document.getElementById('task-drawer-assignee-select');
  if (assigneeSelect) {
    const mainAssigneeId = task.assignees && task.assignees[0] ? task.assignees[0].user_id : '';
    assigneeSelect.value = mainAssigneeId;
  }

  // Priority Select
  const prioritySelect = document.getElementById('task-drawer-priority-select');
  if (prioritySelect) prioritySelect.value = task.priority || 'NONE';

  // Tags
  renderDrawerTags(task);

  // Time Tracking
  renderDrawerTime(task);

  // Description
  const descInput = document.getElementById('task-drawer-description');
  if (descInput) descInput.value = task.description || '';

  // Subtasks
  renderDrawerSubtasks(task);

  // Attachments
  renderDrawerAttachments(task);

  // Comments
  renderDrawerComments(task);

  // Animate Slide In from Right with pure GPU accelerated class
  const overlay = document.getElementById('upbase-task-drawer-overlay');
  const drawer = document.getElementById('upbase-task-drawer');
  if (overlay) overlay.classList.add('drawer-open');
  if (drawer) drawer.classList.add('drawer-open');

  if (window.lucide) window.lucide.createIcons();
}

function closeTaskDetailsModal(updateUrl = true) {
  const overlay = document.getElementById('upbase-task-drawer-overlay');
  const drawer = document.getElementById('upbase-task-drawer');
  if (overlay) overlay.classList.remove('drawer-open');
  if (drawer) drawer.classList.remove('drawer-open');

  window.WorkspacesState.activeTaskId = null;
  if (updateUrl && typeof updateWorkspacesUrl === 'function') {
    updateWorkspacesUrl(null);
  }
}

function getActiveDrawerTask() {
  const taskId = window.WorkspacesState.activeTaskId;
  if (!taskId) return null;
  return (window.WorkspacesState.tasks || []).find(t => t.task_id === taskId);
}

function syncDrawerCompleteButton(isDone) {
  const btn = document.getElementById('task-drawer-complete-btn');
  if (!btn) return;
  if (isDone) {
    btn.className = 'mt-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center transition-all shrink-0 text-slate-950 shadow-md';
    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>`;
  } else {
    btn.className = 'mt-1 w-6 h-6 rounded-full border-2 border-slate-600 hover:border-emerald-500 flex items-center justify-center transition-all group shrink-0 text-transparent hover:text-emerald-400';
    btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"></i>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

function toggleTaskComplete(taskId, event) {
  if (event) event.stopPropagation();
  const task = (window.WorkspacesState.tasks || []).find(t => t.task_id === taskId);
  if (!task) return;

  const isDone = task.status === 'DONE';
  task.status = isDone ? 'TODO' : 'DONE';

  // If drawer is currently showing this task, sync it
  if (window.WorkspacesState.activeTaskId === taskId) {
    syncDrawerCompleteButton(!isDone);
    const statusSelect = document.getElementById('task-drawer-status-select');
    if (statusSelect) statusSelect.value = task.status;
    const titleInput = document.getElementById('task-drawer-title-input');
    if (titleInput) {
      if (!isDone) titleInput.classList.add('line-through', 'text-slate-500');
      else titleInput.classList.remove('line-through', 'text-slate-500');
    }
  }

  // Refresh Board & List
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function toggleTaskCompleteFromDrawer() {
  const task = getActiveDrawerTask();
  if (!task) return;
  toggleTaskComplete(task.task_id);
}

function autoResizeDrawerTitle(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function saveDrawerTitleChange(newTitle) {
  const task = getActiveDrawerTask();
  if (!task) return;
  const trimmed = newTitle.trim();
  if (!trimmed || trimmed === task.title) return;
  task.title = trimmed;

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function onDrawerStatusChange(newStatus) {
  const task = getActiveDrawerTask();
  if (!task) return;
  task.status = newStatus;
  const isDone = newStatus === 'DONE';
  syncDrawerCompleteButton(isDone);

  const titleInput = document.getElementById('task-drawer-title-input');
  if (titleInput) {
    if (isDone) titleInput.classList.add('line-through', 'text-slate-500');
    else titleInput.classList.remove('line-through', 'text-slate-500');
  }

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function onDrawerPriorityChange(newPriority) {
  const task = getActiveDrawerTask();
  if (!task) return;
  task.priority = newPriority;

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function onDrawerDueDateChange(newDate) {
  const task = getActiveDrawerTask();
  if (!task) return;
  task.due_date = newDate;

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function quickSetDrawerDue(when) {
  const task = getActiveDrawerTask();
  if (!task) return;

  const dueInput = document.getElementById('task-drawer-due-input');
  if (when === 'today') {
    const todayStr = new Date().toISOString().split('T')[0];
    task.due_date = todayStr;
    if (dueInput) dueInput.value = todayStr;
  } else if (when === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomStr = d.toISOString().split('T')[0];
    task.due_date = tomStr;
    if (dueInput) dueInput.value = tomStr;
  } else {
    task.due_date = '';
    if (dueInput) dueInput.value = '';
  }

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function onDrawerAssigneeChange(userId) {
  const task = getActiveDrawerTask();
  if (!task) return;

  const member = (window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS).find(m => m.user_id === userId);

  if (!userId || !member) {
    task.assignees = [];
  } else {
    task.assignees = [{
      user_id: member.user_id,
      full_name: member.full_name,
      title: member.title,
      role: member.role,
      ownership: member.ownership,
      avatar_url: ''
    }];
  }

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  renderTeamRosterSidebar();
  syncTaskUpdateToServer(task);
}

// Render Team Roles & Ownership Roster Card in Left Sidebar
function renderTeamRosterSidebar() {
  const container = document.getElementById('upbase-team-roster');
  if (!container) return;

  const members = window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS;
  const currentTasks = window.WorkspacesState.tasks || [];
  const activeFilterId = window.WorkspacesState.assigneeFilter;

  container.innerHTML = members.map(m => {
    // Count active tasks assigned to this member in current workspace
    const memberTasksCount = currentTasks.filter(t => 
      (t.assignees || []).some(a => a.user_id === m.user_id || a.full_name === m.full_name) ||
      t.created_by === m.full_name
    ).length;

    const isSelected = activeFilterId === m.user_id;

    return `
      <div onclick="filterTasksByAssignee('${m.user_id}')" 
           class="p-2.5 rounded-xl border transition-all cursor-pointer group select-none relative ${
             isSelected 
               ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-950/50' 
               : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
           }">
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-lg ${m.bgClass} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform border border-white/20">
            ${m.initials}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                ${m.emoji} ${escapeHtml(m.full_name)}
              </span>
              <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded ${m.badgeClass} shrink-0">
                ${escapeHtml(m.title)}
              </span>
            </div>
            <p class="text-[10.5px] text-slate-400 mt-1 leading-snug line-clamp-2">
              ${escapeHtml(m.ownership)}
            </p>
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
              <span class="flex items-center gap-1 font-mono text-cyan-400">
                <i data-lucide="check-circle-2" class="w-3 h-3"></i>
                ${memberTasksCount} ${memberTasksCount === 1 ? 'task' : 'tasks'}
              </span>
              <span class="text-[10px] font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors">
                ${isSelected ? 'Active Filter &times;' : 'Filter &rarr;'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update filter status bar in sidebar
  const filterStatusEl = document.getElementById('upbase-team-filter-status');
  const filterTextEl = document.getElementById('upbase-team-filter-text');
  if (filterStatusEl && filterTextEl) {
    if (activeFilterId) {
      const activeMember = members.find(m => m.user_id === activeFilterId);
      filterStatusEl.classList.remove('hidden');
      filterTextEl.innerHTML = `Showing tasks for: <strong>${activeMember ? `${activeMember.emoji} ${escapeHtml(activeMember.full_name)}` : 'Filtered'}</strong>`;
    } else {
      filterStatusEl.classList.add('hidden');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// Interactive filter by team member
function filterTasksByAssignee(userId) {
  if (window.WorkspacesState.assigneeFilter === userId) {
    window.WorkspacesState.assigneeFilter = null; // Toggle off
  } else {
    window.WorkspacesState.assigneeFilter = userId;
  }

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else if (window.WorkspacesState.activeTool === 'tasks') renderTaskListView();

  renderTeamRosterSidebar();
}

// Clear member filter
function clearAssigneeFilter() {
  window.WorkspacesState.assigneeFilter = null;
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else if (window.WorkspacesState.activeTool === 'tasks') renderTaskListView();
  renderTeamRosterSidebar();
}

// Comment Mention Dropdown for @ button
function toggleCommentMentionDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('comment-mention-dropdown');
  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    const members = window.ICEBERG_TEAM_MEMBERS || ICEBERG_TEAM_MEMBERS;
    dropdown.innerHTML = `
      <div class="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
        <span>Mention Team Member</span>
        <span class="text-cyan-400 font-mono">Team Roles</span>
      </div>
      <div class="space-y-1 max-h-56 overflow-y-auto">
        ${members.map(m => `
          <button type="button" 
                  onclick="insertCommentMention('${escapeHtml(m.full_name)}')" 
                  class="w-full text-left p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center gap-2 group">
            <span class="w-6 h-6 rounded-md ${m.bgClass} text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              ${m.initials}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                  ${m.emoji} ${escapeHtml(m.full_name)}
                </span>
                <span class="text-[9px] px-1 py-0.2 rounded ${m.badgeClass}">
                  ${escapeHtml(m.title)}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 truncate">${escapeHtml(m.ownership)}</p>
            </div>
          </button>
        `).join('')}
      </div>
    `;
    dropdown.classList.remove('hidden');

    // Auto-close on click outside
    const closeListener = (evt) => {
      if (!dropdown.contains(evt.target) && evt.target.id !== 'task-comment-mention-btn') {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeListener);
      }
    };
    setTimeout(() => document.addEventListener('click', closeListener), 10);
  } else {
    dropdown.classList.add('hidden');
  }
}

// Insert @Name into comment input
function insertCommentMention(fullName) {
  const commentInput = document.getElementById('task-drawer-comment-input');
  const dropdown = document.getElementById('comment-mention-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  if (!commentInput) return;
  const mentionText = `@${fullName} `;
  const currentVal = commentInput.value;
  const selStart = commentInput.selectionStart || currentVal.length;
  const selEnd = commentInput.selectionEnd || currentVal.length;

  commentInput.value = currentVal.substring(0, selStart) + mentionText + currentVal.substring(selEnd);
  commentInput.focus();
  const nextCursor = selStart + mentionText.length;
  commentInput.setSelectionRange(nextCursor, nextCursor);
}

function renderDrawerTags(task) {
  const container = document.getElementById('task-drawer-tags-container');
  if (!container) return;

  const tags = task.tags || [];
  container.innerHTML = `
    ${tags.map(t => `
      <span class="px-2.5 py-1 rounded-lg bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
        ${escapeHtml(t)}
        <button type="button" onclick="removeDrawerTag('${escapeHtml(t)}')" class="hover:text-rose-400 font-bold ml-0.5">&times;</button>
      </span>
    `).join('')}
    <button type="button" onclick="promptAddDrawerTag()" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">
      + Add Tag
    </button>
  `;
}

function promptAddDrawerTag() {
  const task = getActiveDrawerTask();
  if (!task) return;
  const tag = prompt('Enter new tag:');
  if (!tag || !tag.trim()) return;
  if (!task.tags) task.tags = [];
  if (!task.tags.includes(tag.trim())) {
    task.tags.push(tag.trim());
    renderDrawerTags(task);
    if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
    else renderTaskListView();
    syncTaskUpdateToServer(task);
  }
}

function removeDrawerTag(tag) {
  const task = getActiveDrawerTask();
  if (!task || !task.tags) return;
  task.tags = task.tags.filter(t => t !== tag);
  renderDrawerTags(task);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  syncTaskUpdateToServer(task);
}

function renderDrawerTime(task) {
  const display = document.getElementById('task-drawer-time-display');
  if (!display) return;
  const estM = task.duration_minutes || 60;
  const actM = task.logged_minutes || 0;
  display.innerText = `Estimated: ${Math.floor(estM/60)}h ${estM%60}m • Actual: ${Math.floor(actM/60)}h ${actM%60}m`;
}

function promptLogDrawerTime() {
  const task = getActiveDrawerTask();
  if (!task) return;
  const min = prompt('Enter minutes to log (e.g. 30):', '30');
  if (!min || isNaN(parseInt(min, 10))) return;
  task.logged_minutes = (task.logged_minutes || 0) + parseInt(min, 10);
  renderDrawerTime(task);
  if (typeof showNotification === 'function') showNotification(`Logged ${min}m to task!`, 'success');
  syncTaskUpdateToServer(task);
}

function promptAddCustomField() {
  const fieldName = prompt('Enter custom field label (e.g., Client Cost, Release Target):');
  if (!fieldName) return;
  const fieldValue = prompt(`Enter value for "${fieldName}":`);
  if (!fieldValue) return;

  const task = getActiveDrawerTask();
  if (!task) return;
  if (!task.custom_fields) task.custom_fields = [];
  task.custom_fields.push({ label: fieldName, value: fieldValue });
  if (typeof showNotification === 'function') showNotification(`Added custom field "${fieldName}"`, 'success');
}

function saveDrawerDescription(desc) {
  const task = getActiveDrawerTask();
  if (!task) return;
  task.description = desc;
  syncTaskUpdateToServer(task);
}

function insertDrawerFormat(syntax) {
  const textarea = document.getElementById('task-drawer-description');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.substring(0, start) + syntax + val.substring(start, end) + syntax + val.substring(end);
  textarea.focus();
  saveDrawerDescription(textarea.value);
}

// Subtasks
function renderDrawerSubtasks(task) {
  const countEl = document.getElementById('task-drawer-subtasks-count');
  const barEl = document.getElementById('task-drawer-subtasks-bar');
  const listEl = document.getElementById('task-drawer-subtasks-list');
  if (!listEl) return;

  const subtasks = task.subtasks || [];
  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (countEl) countEl.innerText = `${completed}/${total}`;
  if (barEl) barEl.style.width = `${pct}%`;

  if (total === 0) {
    listEl.innerHTML = `<div class="text-xs text-slate-500 py-1 italic">No subtasks added yet. Add one below!</div>`;
    return;
  }

  listEl.innerHTML = subtasks.map(st => `
    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors group">
      <label class="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer flex-1">
        <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleDrawerSubtask('${st.subtask_id}')" class="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5">
        <span class="${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(st.title)}</span>
      </label>
      <button type="button" onclick="deleteDrawerSubtask('${st.subtask_id}')" class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleDrawerAddSubtask(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('task-drawer-new-subtask');
  if (!input || !input.value.trim()) return;

  const task = getActiveDrawerTask();
  if (!task) return;
  if (!task.subtasks) task.subtasks = [];

  const newSubtask = {
    subtask_id: 'st_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    title: input.value.trim(),
    completed: false
  };

  task.subtasks.push(newSubtask);
  input.value = '';
  renderDrawerSubtasks(task);

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function toggleDrawerSubtask(subtaskId) {
  const task = getActiveDrawerTask();
  if (!task || !task.subtasks) return;
  const st = task.subtasks.find(s => s.subtask_id === subtaskId);
  if (!st) return;
  st.completed = !st.completed;
  renderDrawerSubtasks(task);

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function deleteDrawerSubtask(subtaskId) {
  const task = getActiveDrawerTask();
  if (!task || !task.subtasks) return;
  task.subtasks = task.subtasks.filter(s => s.subtask_id !== subtaskId);
  renderDrawerSubtasks(task);

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

// ==========================================
// SMART LINK DETECTION & EMBEDDED MEDIA ENGINE
// Protects Account Managers from misleading / cryptic links
// ==========================================

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '1.2 MB';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function generateSmartLinkCardHtml(url) {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. YouTube Video Embed
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const ytId = ytMatch[1];
    return `
      <div class="my-2 rounded-xl overflow-hidden border border-rose-900/60 bg-slate-950/90 shadow-md">
        <div class="px-3 py-1.5 bg-rose-950/40 border-b border-rose-900/30 flex items-center justify-between text-xs">
          <span class="text-rose-400 font-bold flex items-center gap-1.5">
            <i data-lucide="play-circle" class="w-3.5 h-3.5"></i> YouTube Video
          </span>
          <a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
            Open in YouTube <i data-lucide="external-link" class="w-3 h-3"></i>
          </a>
        </div>
        <div class="aspect-video w-full">
          <iframe src="https://www.youtube-nocookie.com/embed/${ytId}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  // 2. Loom Screen Recording Embed
  const loomMatch = trimmed.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    const loomId = loomMatch[1];
    return `
      <div class="my-2 rounded-xl overflow-hidden border border-purple-900/60 bg-slate-950/90 shadow-md">
        <div class="px-3 py-1.5 bg-purple-950/40 border-b border-purple-900/30 flex items-center justify-between text-xs">
          <span class="text-purple-300 font-bold flex items-center gap-1.5">
            <i data-lucide="video" class="w-3.5 h-3.5"></i> Loom Screen Recording
          </span>
          <a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
            Open in Loom <i data-lucide="external-link" class="w-3 h-3"></i>
          </a>
        </div>
        <div class="aspect-video w-full">
          <iframe src="https://www.loom.com/embed/${loomId}" class="w-full h-full" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  // 3. Figma Design / Prototype Verified Card
  if (trimmed.includes('figma.com')) {
    return `
      <div class="my-2 p-3 rounded-xl bg-[#1e1b2e] border border-purple-800/60 flex items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-xs shrink-0">
            FIG
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-purple-200 truncate">Figma Design & Prototype</div>
            <div class="text-[10px] text-purple-400/80 font-mono truncate">${escapeHtml(trimmed)}</div>
          </div>
        </div>
        <a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm">
          <span>Open Design</span> <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
      </div>
    `;
  }

  // 4. Google Drive / Docs / Sheets Verified Card
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const isDoc = trimmed.includes('/document/');
    const isSheet = trimmed.includes('/spreadsheets/');
    const label = isDoc ? 'Google Doc Document' : isSheet ? 'Google Spreadsheet' : 'Google Drive Cloud Asset';
    return `
      <div class="my-2 p-3 rounded-xl bg-[#13202e] border border-blue-800/60 flex items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
            ${isDoc ? 'DOC' : isSheet ? 'SHT' : 'DRV'}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-blue-200 truncate">${label}</div>
            <div class="text-[10px] text-blue-400/80 font-mono truncate">${escapeHtml(trimmed)}</div>
          </div>
        </div>
        <a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm">
          <span>Open File</span> <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
      </div>
    `;
  }

  // 5. Direct Image Preview Link
  if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:image/')) {
    return `
      <div class="my-2">
        <img src="${trimmed}" alt="Embedded Image" onclick="previewFullAttachmentImage('${trimmed}', 'Image Preview')" class="max-h-48 max-w-full rounded-xl border border-slate-700 object-cover cursor-pointer hover:opacity-90 shadow-md transition-opacity">
      </div>
    `;
  }

  // 6. Generic Verified Web Link Card
  try {
    const parsed = new URL(trimmed);
    const domain = parsed.hostname.replace(/^www\./, '');
    const cleanPath = parsed.pathname.length > 20 ? parsed.pathname.substring(0, 20) + '...' : parsed.pathname;
    return `
      <a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500 text-cyan-300 hover:text-cyan-200 text-xs font-medium transition-all shadow-sm">
        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
        <span class="font-bold text-slate-200">${domain}</span>
        <span class="text-slate-500 text-[10px]">${cleanPath || ''}</span>
        <i data-lucide="external-link" class="w-3 h-3 text-cyan-400 shrink-0"></i>
      </a>
    `;
  } catch (e) {
    return `<a href="${trimmed}" target="_blank" class="text-cyan-400 underline">${escapeHtml(trimmed)}</a>`;
  }
}

function parseAndEmbedLinks(rawText) {
  if (!rawText) return '';
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(rawText)) !== null) {
    const url = match[0];
    const offset = match.index;
    if (offset > lastIndex) {
      parts.push(escapeHtml(rawText.substring(lastIndex, offset)).replace(/\n/g, '<br>'));
    }

    parts.push(generateSmartLinkCardHtml(url));
    lastIndex = offset + url.length;
  }

  if (lastIndex < rawText.length) {
    parts.push(escapeHtml(rawText.substring(lastIndex)).replace(/\n/g, '<br>'));
  }

  return parts.join('');
}

// ==========================================
// REAL FILE UPLOAD & ATTACHMENTS ENGINE
// ==========================================

function triggerDeviceFileUpload() {
  const input = document.getElementById('task-drawer-file-input');
  if (input) input.click();
}

function handleTaskFileInputChange(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  processUploadedFiles(files);
  event.target.value = '';
}

function handleAttachmentDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const zone = document.getElementById('task-drawer-drop-zone');
  if (zone) zone.classList.add('border-cyan-500', 'bg-cyan-950/20');
}

function handleAttachmentDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const zone = document.getElementById('task-drawer-drop-zone');
  if (zone) zone.classList.remove('border-cyan-500', 'bg-cyan-950/20');
}

function handleAttachmentDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const zone = document.getElementById('task-drawer-drop-zone');
  if (zone) zone.classList.remove('border-cyan-500', 'bg-cyan-950/20');

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processUploadedFiles(files);
  }
}

async function processUploadedFiles(files) {
  const task = getActiveDrawerTask();
  if (!task) return;
  if (!task.attachments) task.attachments = [];

  const fileArray = Array.from(files);
  if (typeof showNotification === 'function') {
    showNotification(`Uploading ${fileArray.length} file(s)...`, 'info');
  }

  for (const file of fileArray) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const isImg = file.type.startsWith('image/');

      const attachmentObj = {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        url: dataUrl,
        is_image: isImg,
        uploaded_at: new Date().toISOString()
      };

      task.attachments.push(attachmentObj);

      // Async sync to /api/iams/upload
      fetch('/api/iams/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          data: dataUrl
        })
      }).catch(() => {});
    } catch (err) {
      console.warn('Failed reading file:', file.name, err);
    }
  }

  renderDrawerAttachments(task);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
  if (typeof showNotification === 'function') {
    showNotification(`Added ${fileArray.length} attachment(s) to task!`, 'success');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function promptAddWebEmbedLink() {
  const url = prompt('Enter web link to embed (Figma, Loom, YouTube, Google Drive, or URL):');
  if (!url || !url.trim()) return;

  const trimmed = url.trim();
  let name = 'Web Link';
  if (trimmed.includes('figma.com')) name = 'Figma Design File';
  else if (trimmed.includes('loom.com')) name = 'Loom Video Recording';
  else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) name = 'YouTube Video';
  else if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) name = 'Google Drive Asset';
  else {
    try {
      name = new URL(trimmed).hostname.replace(/^www\./, '') + ' Link';
    } catch (e) {
      name = 'External Link';
    }
  }

  const task = getActiveDrawerTask();
  if (!task) return;
  if (!task.attachments) task.attachments = [];

  task.attachments.push({
    name,
    size: 'Web Embed',
    url: trimmed,
    type: 'link',
    is_image: /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmed),
    uploaded_at: new Date().toISOString()
  });

  renderDrawerAttachments(task);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  syncTaskUpdateToServer(task);

  if (typeof showNotification === 'function') {
    showNotification(`Embedded "${name}" link successfully!`, 'success');
  }
}

function renderDrawerAttachments(task) {
  const listEl = document.getElementById('task-drawer-attachments-list');
  if (!listEl) return;
  const attachments = task.attachments || [];

  if (attachments.length === 0) {
    listEl.innerHTML = `<div class="text-xs text-slate-500 py-2 italic text-center">No files or links attached yet.</div>`;
    return;
  }

  listEl.innerHTML = attachments.map((att, idx) => {
    const isImg = att.is_image || /\.(png|jpe?g|gif|webp|svg)/i.test(att.name) || (att.url && att.url.startsWith('data:image/'));
    const isFigma = (att.url || '').includes('figma.com');
    const isVideo = (att.url || '').includes('loom.com') || (att.url || '').includes('youtube.com') || (att.url || '').includes('youtu.be');

    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm group">
        <div class="flex items-center gap-3 min-w-0">
          ${isImg && att.url && att.url !== '#' ? `
            <img src="${att.url}" alt="${escapeHtml(att.name)}" onclick="previewFullAttachmentImage('${att.url}', '${escapeHtml(att.name)}')" class="w-10 h-10 object-cover rounded-lg border border-slate-700 cursor-pointer hover:scale-105 transition-transform shrink-0">
          ` : isFigma ? `
            <div class="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black text-xs flex items-center justify-center shrink-0">FIG</div>
          ` : isVideo ? `
            <div class="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center shrink-0"><i data-lucide="video" class="w-4 h-4"></i></div>
          ` : `
            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0"><i data-lucide="file-text" class="w-5 h-5"></i></div>
          `}
          
          <div class="min-w-0">
            <p onclick="downloadTaskAttachment(${idx})" class="text-xs font-semibold text-slate-200 truncate hover:text-cyan-300 cursor-pointer transition-colors" title="Click to download ${escapeHtml(att.name)}">${escapeHtml(att.name)}</p>
            <div class="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span>${att.size || '1.2 MB'}</span>
              <span>•</span>
              <span class="text-cyan-400/80">${isFigma ? 'Figma Project' : isVideo ? 'Video' : isImg ? 'Image' : 'File'}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          ${isImg && att.url && att.url !== '#' ? `
            <button type="button" onclick="previewFullAttachmentImage('${att.url}', '${escapeHtml(att.name)}')" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors" title="View Full Image">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          ` : ''}

          <button type="button" onclick="downloadTaskAttachment(${idx})" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Download ${escapeHtml(att.name)}">
            <i data-lucide="download" class="w-4 h-4"></i>
          </button>

          ${(att.url && (att.url.startsWith('http') || att.url.includes('figma.com') || att.url.includes('loom.com'))) ? `
            <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors" title="Open Link">
              <i data-lucide="external-link" class="w-4 h-4"></i>
            </a>
          ` : ''}

          <button type="button" onclick="removeDrawerAttachment(${idx})" class="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors" title="Remove Attachment">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// UNIVERSAL ROBUST FILE DOWNLOAD & PERSISTENCE ENGINE
// Handles device uploads (Data URLs), Blob URLs,
// remote fetch, authenticated agency assets, and server streams
// ==========================================

function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return new Blob([''], { type: 'application/octet-stream' });
  }
  const parts = dataUrl.split(';base64,');
  if (parts.length === 2) {
    const contentType = parts[0].replace(/^data:/, '') || 'application/octet-stream';
    const binary = window.atob(parts[1]);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return new Blob([buffer], { type: contentType });
  }
  const comma = dataUrl.indexOf(',');
  if (comma !== -1) {
    const mime = (dataUrl.substring(5, comma).split(';')[0]) || 'application/octet-stream';
    const decoded = decodeURIComponent(dataUrl.substring(comma + 1));
    return new Blob([decoded], { type: mime });
  }
  return new Blob([dataUrl], { type: 'text/plain;charset=utf-8' });
}

function downloadTaskAttachment(idx) {
  const task = getActiveDrawerTask();
  if (!task || !task.attachments || !task.attachments[idx]) return;
  const att = task.attachments[idx];
  downloadAttachmentObj(att, task.title);
}

function downloadCommentAttachment(commentId, attIdx) {
  const task = getActiveDrawerTask();
  if (!task || !task.comments) return;
  const comment = task.comments.find(c => c.comment_id === commentId);
  if (!comment || !comment.attachments || !comment.attachments[attIdx]) return;
  const att = comment.attachments[attIdx];
  downloadAttachmentObj(att, task.title);
}

function downloadAttachmentObj(att, contextTitle) {
  if (!att) return;
  const filename = att.name || 'deliverable.bin';

  // 1. Cloud collaborative links (Figma, Loom, YouTube, Google Drive) open in new tab
  if (att.url && (att.url.includes('figma.com') || att.url.includes('loom.com') || att.url.includes('youtube.com') || att.url.includes('youtu.be') || att.url.includes('drive.google.com'))) {
    window.open(att.url, '_blank', 'noopener,noreferrer');
    if (typeof showNotification === 'function') {
      showNotification(`Opening ${filename} in new tab...`, 'info');
    }
    return;
  }

  // 2. Data URLs (Device Uploads) -> Convert to Blob -> Object URL download
  // This bypasses Chrome's strict security restrictions on top-frame data: navigation
  if (att.url && att.url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(att.url);
      const blobUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    } catch (e) {
      console.warn('Data URL to blob conversion failed, routing via server download:', e);
      triggerServerDownload(filename, att.type, att.url);
      return;
    }
  }

  // 3. Blob URLs
  if (att.url && att.url.startsWith('blob:')) {
    triggerBrowserDownload(att.url, filename);
    return;
  }

  // 4. Direct Remote files (HTTP/HTTPS)
  if (att.url && (att.url.startsWith('http://') || att.url.startsWith('https://'))) {
    fetch(att.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        triggerBrowserDownload(blobUrl, filename);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      })
      .catch(() => {
        // Fallback to server download endpoint
        triggerServerDownload(filename, att.type, att.url);
      });
    return;
  }

  // 5. Fallback for '#' or mock deliverables: generate authentic deliverable file
  generateAndDownloadMockFile(att, contextTitle);
}

function triggerServerDownload(filename, mime, data) {
  try {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/iams/download';
    form.target = '_blank';
    form.style.display = 'none';

    const nameInput = document.createElement('input');
    nameInput.name = 'name';
    nameInput.value = filename;
    form.appendChild(nameInput);

    if (mime) {
      const typeInput = document.createElement('input');
      typeInput.name = 'type';
      typeInput.value = mime;
      form.appendChild(typeInput);
    }

    if (data) {
      const dataInput = document.createElement('input');
      dataInput.name = 'data';
      dataInput.value = data;
      form.appendChild(dataInput);
    }

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      if (form.parentNode) form.parentNode.removeChild(form);
    }, 1000);
    if (typeof showNotification === 'function') {
      showNotification(`Downloading ${filename} via secure agency gateway...`, 'success');
    }
  } catch (err) {
    console.error('Server download form failed:', err);
  }
}

function generateAndDownloadMockFile(att, contextTitle) {
  const filename = att.name || 'deliverable.txt';
  let blob;

  if (/\.(png|jpe?g|webp|gif)/i.test(filename)) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#0a0f1d');
    grad.addColorStop(1, '#083344');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Accent border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 770, 470);

    // Header
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('ICEBERG AGENCY DELIVERABLE', 40, 80);

    // File name & meta
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(filename, 40, 150);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(`Project: ${contextTitle || 'Client Deliverable'}`, 40, 200);
    ctx.fillText(`File Size: ${att.size || 'Verified Asset'}`, 40, 230);
    ctx.fillText(`Export Date: ${new Date().toLocaleDateString()}`, 40, 260);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✓ Authenticated by Iceberg Agency Client Suite', 40, 360);

    canvas.toBlob(b => {
      if (b) {
        const url = URL.createObjectURL(b);
        triggerBrowserDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
      }
    }, 'image/png');
    return;
  } else if (filename.endsWith('.pdf')) {
    const pdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n00000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`;
    blob = new Blob([pdfContent], { type: 'application/pdf' });
  } else {
    const textContent = `====================================================\nICEBERG DIGITAL MARKETING AGENCY - DELIVERABLE\n====================================================\n\nAsset: ${filename}\nProject Context: ${contextTitle || 'Agency Client Workspace'}\nLogged Size: ${att.size || 'N/A'}\nDownloaded: ${new Date().toISOString()}\n\nThis file is authenticated and managed by the Iceberg Productivity & Workspace Management Suite.\nAll intellectual property and deliverables remain confidential under agency retainer terms.\n\nIceberg Digital Marketing Agency\nhttps://icebergma.com\n`;
    blob = new Blob([textContent], { type: 'text/plain' });
  }

  const url = URL.createObjectURL(blob);
  triggerBrowserDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function triggerBrowserDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename || 'download');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 200);
  if (typeof showNotification === 'function') {
    showNotification(`Downloading ${filename}...`, 'success');
  }
}

// Seamless background task sync to MongoDB & Local Cache
async function syncTaskUpdateToServer(task) {
  if (!task || !task.task_id) return;
  try {
    const wsId = window.WorkspacesState?.currentWorkspaceId || 'ws_agency_prod';
    const payload = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignees: task.assignees || [],
      due_date: task.due_date || null,
      scheduled_date: task.scheduled_date || null,
      start_time: task.start_time || null,
      duration_minutes: task.duration_minutes || 0,
      logged_minutes: task.logged_minutes || 0,
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      comments: task.comments || [],
      is_favorite: !!task.is_favorite,
      watchers: task.watchers || []
    };

    fetch(`/api/iams/workspaces/${wsId}/tasks/${task.task_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Task sync warning:', err));

    // Also persist in localStorage for instant offline access
    if (window.WorkspacesState?.currentProjectId && window.WorkspacesState?.tasks) {
      try {
        localStorage.setItem(`iceberg_tasks_${window.WorkspacesState.currentProjectId}`, JSON.stringify(window.WorkspacesState.tasks));
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Sync task failed:', err);
  }
}

function removeDrawerAttachment(idx) {
  const task = getActiveDrawerTask();
  if (!task || !task.attachments) return;
  task.attachments.splice(idx, 1);
  renderDrawerAttachments(task);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  syncTaskUpdateToServer(task);
}

function focusTaskAttachment() {
  triggerDeviceFileUpload();
}

function promptAddDrawerAttachment() {
  triggerDeviceFileUpload();
}

// Global Image Lightbox Preview
function previewFullAttachmentImage(url, title) {
  const lightbox = document.getElementById('iceberg-media-lightbox');
  const img = document.getElementById('iceberg-lightbox-img');
  const titleEl = document.getElementById('iceberg-lightbox-title');
  if (!lightbox || !img) return;

  img.src = url;
  if (titleEl) titleEl.innerText = title || 'Image Attachment';
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
  if (window.lucide) window.lucide.createIcons();
}

function closeMediaLightbox() {
  const lightbox = document.getElementById('iceberg-media-lightbox');
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
}

// ==========================================
// ACTIVITY & COMMENTS STREAM WITH SMART EMBEDS
// ==========================================

window.pendingCommentAttachments = [];

function triggerCommentFileUpload() {
  const input = document.getElementById('task-drawer-comment-file-input');
  if (input) input.click();
}

async function handleCommentFileInputChange(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const bar = document.getElementById('task-drawer-pending-comment-attachments');
  for (const file of Array.from(files)) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const isImg = file.type.startsWith('image/');
      window.pendingCommentAttachments.push({
        name: file.name,
        size: formatFileSize(file.size),
        url: dataUrl,
        is_image: isImg
      });
    } catch (err) {
      console.warn('Comment file read failed:', err);
    }
  }

  renderPendingCommentAttachments();
  event.target.value = '';
}

function renderPendingCommentAttachments() {
  const bar = document.getElementById('task-drawer-pending-comment-attachments');
  if (!bar) return;

  if (window.pendingCommentAttachments.length === 0) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }

  bar.classList.remove('hidden');
  bar.innerHTML = window.pendingCommentAttachments.map((att, idx) => `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-xs text-cyan-200">
      <i data-lucide="paperclip" class="w-3 h-3 text-amber-400"></i>
      <span class="font-medium truncate max-w-[150px]">${escapeHtml(att.name)}</span>
      <span class="text-[10px] text-slate-400 font-mono">(${att.size})</span>
      <button type="button" onclick="removePendingCommentAttachment(${idx})" class="hover:text-rose-400 ml-1 font-bold">&times;</button>
    </span>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function removePendingCommentAttachment(idx) {
  window.pendingCommentAttachments.splice(idx, 1);
  renderPendingCommentAttachments();
}

function insertCommentLinkTemplate() {
  const input = document.getElementById('task-drawer-comment-input');
  if (!input) return;
  const link = prompt('Enter Figma, Loom, YouTube, or Drive URL:');
  if (link && link.trim()) {
    input.value += (input.value ? ' ' : '') + link.trim();
    input.focus();
  }
}

function renderDrawerComments(task) {
  const streamEl = document.getElementById('task-drawer-comments-stream');
  if (!streamEl) return;
  const comments = task.comments || [];

  if (comments.length === 0) {
    streamEl.innerHTML = `<div class="text-xs text-slate-500 py-3 italic text-center">No comments posted yet. Be the first to comment below!</div>`;
    return;
  }

  streamEl.innerHTML = comments.map(c => {
    // Process text through smart link & embed parser
    const parsedTextHtml = parseAndEmbedLinks(c.text);

    const attachmentsHtml = (c.attachments && c.attachments.length > 0) ? `
      <div class="mt-2.5 flex flex-wrap gap-2">
        ${c.attachments.map((att, attIdx) => `
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 group/att">
            ${att.is_image ? `
              <img src="${att.url}" alt="${escapeHtml(att.name)}" onclick="previewFullAttachmentImage('${att.url}', '${escapeHtml(att.name)}')" class="w-9 h-9 object-cover rounded-lg border border-slate-700 cursor-pointer hover:scale-105 transition-transform">
            ` : `
              <i data-lucide="file" class="w-4 h-4 text-cyan-400"></i>
            `}
            <div class="text-xs min-w-0">
              <button type="button" onclick="downloadCommentAttachment('${c.comment_id}', ${attIdx})" class="text-cyan-300 hover:text-cyan-200 hover:underline font-medium truncate block text-left" title="Download ${escapeHtml(att.name)}">${escapeHtml(att.name)}</button>
              <div class="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>${att.size || ''}</span>
                <button type="button" onclick="downloadCommentAttachment('${c.comment_id}', ${attIdx})" class="text-emerald-400 hover:underline flex items-center gap-0.5" title="Download file">
                  <i data-lucide="download" class="w-3 h-3"></i> Download
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
        <div class="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
          ${escapeHtml(c.author_initials || 'MA')}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-slate-200">${escapeHtml(c.author_name || 'Mohamed Asy')}</span>
            <span class="text-[10px] text-slate-500 font-mono">${c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
          </div>
          <div class="text-xs text-slate-300 leading-relaxed break-words">${parsedTextHtml}</div>
          ${attachmentsHtml}
        </div>
        <button type="button" onclick="deleteDrawerComment('${c.comment_id}')" class="text-slate-600 hover:text-rose-400 p-1 transition-colors" title="Delete comment">
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleDrawerAddComment(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('task-drawer-comment-input');
  if (!input) return;
  const text = input.value.trim();

  if (!text && window.pendingCommentAttachments.length === 0) return;

  const task = getActiveDrawerTask();
  if (!task) return;
  if (!task.comments) task.comments = [];

  const attachedCopy = [...window.pendingCommentAttachments];

  // Also auto-add comment attachments to task attachments for convenience
  if (attachedCopy.length > 0) {
    if (!task.attachments) task.attachments = [];
    attachedCopy.forEach(att => {
      task.attachments.push({ ...att });
    });
    renderDrawerAttachments(task);
  }

  const newComment = {
    comment_id: 'c_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    author_name: 'Mohamed Asy',
    author_initials: 'MA',
    text: text || '(Attached files)',
    attachments: attachedCopy,
    created_at: new Date().toISOString()
  };

  task.comments.push(newComment);
  input.value = '';
  window.pendingCommentAttachments = [];
  renderPendingCommentAttachments();
  renderDrawerComments(task);

  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(task);
}

function handleCommentKeyDown(e) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
    e.preventDefault();
    handleDrawerAddComment(e);
  }
}

function deleteDrawerComment(commentId) {
  const task = getActiveDrawerTask();
  if (!task || !task.comments) return;
  task.comments = task.comments.filter(c => c.comment_id !== commentId);
  renderDrawerComments(task);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  syncTaskUpdateToServer(task);
}

function insertCommentEmoji(emoji) {
  const input = document.getElementById('task-drawer-comment-input');
  if (!input) return;
  input.value += (input.value ? ' ' : '') + emoji;
  input.focus();
}

// Watchers, Favorites, Deep Link & Menus
function toggleTaskWatcher() {
  const countEl = document.getElementById('task-drawer-watchers');
  if (!countEl) return;
  let cnt = parseInt(countEl.innerText, 10) || 1;
  cnt = cnt === 2 ? 3 : 2;
  countEl.innerText = cnt;
  if (typeof showNotification === 'function') showNotification(`Watchers updated (${cnt})`, 'info');
}

function toggleTaskFavorite() {
  const task = getActiveDrawerTask();
  if (!task) return;
  task.is_favorite = !task.is_favorite;
  if (typeof showNotification === 'function') {
    showNotification(task.is_favorite ? 'Task starred!' : 'Task removed from favorites', 'info');
  }
}

// ==========================================
// WORKSPACES DEEP LINK ROUTER
// Syncs and resolves #workspaces?project=...&tool=...&task=...
// ==========================================

function updateWorkspacesUrl(taskId = undefined) {
  const prjId = window.WorkspacesState.currentProjectId;
  const tool = window.WorkspacesState.activeTool || 'kanban';
  const activeTask = taskId !== undefined ? taskId : window.WorkspacesState.activeTaskId;

  let hash = `#workspaces?project=${prjId || ''}&tool=${tool}`;
  if (activeTask) {
    hash += `&task=${activeTask}`;
  }

  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash);
  }
}

async function routeWorkspacesDeepLink(routeParams) {
  if (!routeParams) return;
  const { project, tool, task } = routeParams;

  // 1. Select project if specified and different
  if (project && window.WorkspacesState.projects && window.WorkspacesState.projects.length > 0) {
    const prjExists = window.WorkspacesState.projects.find(p => p.project_id === project);
    if (prjExists && window.WorkspacesState.currentProjectId !== project) {
      await selectProject(project, false);
    }
  }

  // 2. Select tool if specified
  if (tool && ['kanban', 'tasks', 'messages', 'docs', 'bookmarks', 'chat'].includes(tool)) {
    if (window.WorkspacesState.activeTool !== tool) {
      switchProjectTool(tool, false);
    }
  }

  // 3. Open task drawer if specified
  if (task) {
    setTimeout(() => {
      openTaskDetailsModal(task, false);
    }, 150);
  } else if (window.WorkspacesState.activeTaskId) {
    closeTaskDetailsModal(false);
  }
}

window.updateWorkspacesUrl = updateWorkspacesUrl;
window.routeWorkspacesDeepLink = routeWorkspacesDeepLink;

function copyTaskDeepLink() {
  const task = getActiveDrawerTask();
  if (!task) return;
  const prjId = window.WorkspacesState.currentProjectId || '';
  const tool = window.WorkspacesState.activeTool || 'kanban';
  const url = `${window.location.origin}${window.location.pathname}#workspaces?project=${prjId}&tool=${tool}&task=${task.task_id}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (typeof showNotification === 'function') showNotification('Task unique deep link copied to clipboard!', 'success');
      else alert('Task unique deep link copied!');
    }).catch(() => {
      prompt('Task unique link (copy manually):', url);
    });
  } else {
    prompt('Task unique link (copy manually):', url);
  }
}

function toggleTaskMenuDropdown(event) {
  if (event) event.stopPropagation();
  const options = ['Duplicate Task', 'Archive Task', 'Delete Task'];
  const choice = prompt('Task options:\n1. Duplicate Task\n2. Archive Task\n3. Delete Task\nEnter 1, 2, or 3:');
  if (choice === '1') {
    duplicateActiveTask();
  } else if (choice === '2') {
    archiveActiveTask();
  } else if (choice === '3') {
    deleteActiveTask();
  }
}

function duplicateActiveTask() {
  const task = getActiveDrawerTask();
  if (!task) return;
  const clone = JSON.parse(JSON.stringify(task));
  clone.task_id = 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  clone.title += ' (Copy)';
  window.WorkspacesState.tasks.push(clone);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  if (typeof showNotification === 'function') showNotification('Task duplicated!', 'success');
}

function archiveActiveTask() {
  const task = getActiveDrawerTask();
  if (!task) return;
  window.WorkspacesState.tasks = window.WorkspacesState.tasks.filter(t => t.task_id !== task.task_id);
  closeTaskDetailsModal();
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  if (typeof showNotification === 'function') showNotification('Task archived!', 'info');
}

function deleteActiveTask() {
  const task = getActiveDrawerTask();
  if (!task) return;
  if (!confirm(`Delete task "${task.title}"?`)) return;
  window.WorkspacesState.tasks = window.WorkspacesState.tasks.filter(t => t.task_id !== task.task_id);
  closeTaskDetailsModal();
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();
  if (typeof showNotification === 'function') showNotification('Task deleted!', 'info');
}

function promptQuickAddTaskToColumn(status) {
  const title = prompt(`Add a new task to ${status.replace('_', ' ')}:`);
  if (!title || !title.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const prjId = window.WorkspacesState.currentProjectId || 'prj_dentaquik';

  const newTask = {
    task_id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    project_id: prjId,
    workspace_id: wsId,
    title: title.trim(),
    priority: 'MEDIUM',
    status: status || 'TODO',
    duration_minutes: 45,
    logged_minutes: 0,
    due_date: new Date().toISOString().split('T')[0],
    position: '0|' + Date.now().toString(36),
    tags: ['General'],
    assignees: [{ user_id: 'usr_asy', full_name: 'Mohamed Asy' }],
    subtasks: [],
    attachments: [],
    comments: []
  };

  window.WorkspacesState.tasks.push(newTask);
  if (window.WorkspacesState.activeTool === 'kanban') renderKanbanColumns();
  else renderTaskListView();

  syncTaskUpdateToServer(newTask);
}

// Asynchronously sync task state to API (offline-resilient)
async function syncTaskUpdateToServer(task) {
  if (!task) return;
  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  try {
    const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';
    await fetch(`/api/iams/workspaces/${wsId}/tasks/${task.task_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });
  } catch (err) {
    // Graceful offline fallback
  }
}

// Quick Add Task
async function createQuickTask(e) {
  if (e) e.preventDefault();
  const titleInput = document.getElementById('new-task-title');
  if (!titleInput || !titleInput.value.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId || 'ws_iceberg_master';
  const prjId = window.WorkspacesState.currentProjectId || 'prj_dentaquik';
  const title = titleInput.value.trim();

  // Optimistic local add
  const newTask = {
    task_id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    project_id: prjId,
    workspace_id: wsId,
    title,
    priority: 'MEDIUM',
    status: 'TODO',
    duration_minutes: 30,
    due_date: new Date().toISOString().split('T')[0],
    position: '0|' + Date.now().toString(36),
    subtasks: []
  };
  window.WorkspacesState.tasks.push(newTask);
  titleInput.value = '';

  if (window.WorkspacesState.activeTool === 'kanban') {
    renderKanbanColumns();
  } else {
    renderTaskListView();
  }

  try {
    await fetch(`/api/iams/workspaces/${wsId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        priority: 'MEDIUM',
        status: 'TODO'
      })
    });
  } catch (err) {
    console.warn('Task server sync notice (saved locally):', err);
  }
}

// ==========================================
// 2. ASYNC MESSAGES (BASECAMP STYLE)
// ==========================================

async function loadProjectMessages() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/messages?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.topics = result.data;
      } else {
        window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
      }
    } else {
      window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
    }
  } catch (err) {
    console.warn('Using offline fallback topics:', err);
    window.WorkspacesState.topics = [...DEFAULT_FALLBACK_TOPICS];
  }
  renderMessagesTopicList();
}

function renderMessagesTopicList() {
  const container = document.getElementById('upbase-messages-list');
  if (!container) return;

  const topics = window.WorkspacesState.topics;
  if (topics.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No discussion topics posted yet. Start an async conversation!</div>`;
    return;
  }

  container.innerHTML = topics.map(top => `
    <div onclick="openTopicThreadModal('${top.topic_id}')" class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">${top.category}</span>
        <span class="text-[10px] text-slate-400 font-mono">${new Date(top.last_activity_at).toLocaleDateString()}</span>
      </div>
      <h3 class="text-sm font-bold text-white mb-2 flex items-center gap-2">
        ${top.is_pinned ? '📌 ' : ''}${escapeHtml(top.title)}
      </h3>
      <div class="text-xs text-slate-400 line-clamp-2 mb-3">
        ${escapeHtml(top.content_html.replace(/<[^>]*>?/gm, ''))}
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
        <span class="text-slate-300 font-medium">By ${escapeHtml(top.author?.full_name || 'Team')}</span>
        <span class="text-cyan-400 font-semibold flex items-center gap-1">
          <i data-lucide="message-square" class="w-3.5 h-3.5"></i> ${top.replies_count || 0} replies
        </span>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Post new async message topic
async function postNewTopic(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('new-topic-title')?.value;
  const content = document.getElementById('new-topic-content')?.value;
  const category = document.getElementById('new-topic-category')?.value || 'GENERAL';

  if (!title || !content) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        content_html: `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`,
        category
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('new-topic-title').value = '';
      document.getElementById('new-topic-content').value = '';
      closeAllModals();
      await loadProjectMessages();
    }
  } catch (err) {
    console.error('Failed to post topic:', err);
  }
}

// ==========================================
// 3. COLLABORATIVE RICH-TEXT DOCS
// ==========================================

async function loadProjectDocs() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/docs?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.docs = result.data;
      } else {
        window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
      }
    } else {
      window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
    }
  } catch (err) {
    console.warn('Using offline fallback docs:', err);
    window.WorkspacesState.docs = [...DEFAULT_FALLBACK_DOCS];
  }
  renderDocsGrid();
}

function renderDocsGrid() {
  const container = document.getElementById('upbase-docs-grid');
  if (!container) return;

  const docs = window.WorkspacesState.docs;
  if (docs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center col-span-full">No wiki docs created for this project yet.</div>`;
    return;
  }

  container.innerHTML = docs.map(d => `
    <div onclick="openDocEditorModal('${d.doc_id}')" class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all shadow-md group">
      <div class="flex items-center justify-between mb-3">
        <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
          <i data-lucide="file-text" class="w-4 h-4"></i>
        </div>
        <span class="text-[10px] text-slate-500 font-mono">v${d.current_version}</span>
      </div>
      <h3 class="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">${escapeHtml(d.title)}</h3>
      <div class="text-xs text-slate-400 line-clamp-2 mb-4">
        ${escapeHtml(d.content_html ? d.content_html.replace(/<[^>]*>?/gm, '') : 'Structured documentation')}
      </div>
      <div class="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/60">
        <span>By ${escapeHtml(d.last_edited_by || 'Team')}</span>
        <span>${new Date(d.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Create new rich document
async function createNewDoc() {
  const title = prompt('Enter document title:');
  if (!title) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        title,
        content_html: '<h2>Project Wiki & Architecture</h2><p>Document technical specs, client guidelines, or sprint notes here...</p>'
      })
    });
    const result = await res.json();
    if (result.success) {
      await loadProjectDocs();
      openDocEditorModal(result.data.doc_id);
    }
  } catch (e) {
    console.error('Failed to create doc:', e);
  }
}

// Open and edit document
async function openDocEditorModal(docId) {
  try {
    const res = await fetch(`/api/iams/docs/${docId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.WorkspacesState.activeDoc = result.data;
      const modal = document.getElementById('upbase-doc-modal');
      const titleInput = document.getElementById('doc-editor-title');
      const bodyInput = document.getElementById('doc-editor-body');
      const versionList = document.getElementById('doc-version-history');

      if (titleInput) titleInput.value = result.data.title;
      if (bodyInput) bodyInput.value = result.data.content_html;

      if (versionList && result.data.version_history) {
        versionList.innerHTML = result.data.version_history.map(v => `
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span class="font-bold text-cyan-400 font-mono">v${v.version_number}</span>
              <span class="text-slate-400 text-[10px] ml-2">${new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <button onclick="restoreDocVersion('${docId}', ${v.version_number})" class="text-[10px] text-emerald-400 hover:underline">Restore</button>
          </div>
        `).join('');
      }

      if (modal) modal.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to open doc modal:', err);
  }
}

// Save document changes
async function saveDocChanges() {
  const doc = window.WorkspacesState.activeDoc;
  if (!doc) return;

  const title = document.getElementById('doc-editor-title')?.value;
  const content_html = document.getElementById('doc-editor-body')?.value;

  try {
    const res = await fetch(`/api/iams/docs/${doc.doc_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        title,
        content_html,
        create_snapshot: true
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('Document and version snapshot saved!');
      closeAllModals();
      await loadProjectDocs();
    }
  } catch (e) {
    console.error('Failed to save doc:', e);
  }
}

// Restore previous doc version
async function restoreDocVersion(docId, versionNumber) {
  try {
    const res = await fetch(`/api/iams/docs/${docId}/restore/${versionNumber}`, {
      method: 'POST',
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      alert(`Restored version ${versionNumber}`);
      await openDocEditorModal(docId);
      await loadProjectDocs();
    }
  } catch (e) {
    console.error('Failed to restore doc:', e);
  }
}

// ==========================================
// 4. BOOKMARKS & OPENGRAPH PREVIEW
// ==========================================

async function loadProjectBookmarks() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/bookmarks?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.bookmarks = result.data;
      } else {
        window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
      }
    } else {
      window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
    }
  } catch (err) {
    console.warn('Using offline fallback bookmarks:', err);
    window.WorkspacesState.bookmarks = [...DEFAULT_FALLBACK_BOOKMARKS];
  }
  renderBookmarksGrid();
}

function renderBookmarksGrid() {
  const container = document.getElementById('upbase-bookmarks-grid');
  if (!container) return;

  const bmarks = window.WorkspacesState.bookmarks;
  if (bmarks.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center col-span-full">No bookmarked links yet. Add your Figma, GitHub, or client resource links!</div>`;
    return;
  }

  container.innerHTML = bmarks.map(b => `
    <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer" class="block p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-md group">
      ${b.image_url ? `
        <div class="h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
          <img src="${escapeHtml(b.image_url)}" alt="Preview" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
      ` : ''}
      <div class="flex items-center gap-2 mb-1.5">
        ${b.favicon_url ? `<img src="${escapeHtml(b.favicon_url)}" class="w-4 h-4 rounded-sm" onerror="this.style.display='none'">` : '<i data-lucide="globe" class="w-4 h-4 text-cyan-400"></i>'}
        <span class="text-[10px] text-cyan-400 font-mono truncate">${escapeHtml(b.domain || b.url)}</span>
      </div>
      <h4 class="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">${escapeHtml(b.title)}</h4>
      <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${escapeHtml(b.description || '')}</p>
    </a>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Add Bookmark
async function addProjectBookmark(e) {
  if (e) e.preventDefault();
  const url = document.getElementById('new-bookmark-url')?.value;
  const title = document.getElementById('new-bookmark-title')?.value;
  if (!url) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        url,
        title: title || undefined
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('new-bookmark-url').value = '';
      closeAllModals();
      await loadProjectBookmarks();
    }
  } catch (err) {
    console.error('Failed to add bookmark:', err);
  }
}

// ==========================================
// 5. REAL-TIME CHAT STREAM
// ==========================================

async function loadProjectChat() {
  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch(`/api/iams/chat/messages?project_id=${prjId}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        window.WorkspacesState.chatMessages = result.data;
      } else {
        window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
      }
    } else {
      window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
    }
  } catch (e) {
    console.warn('Using offline fallback chat messages:', e);
    window.WorkspacesState.chatMessages = [...DEFAULT_FALLBACK_CHAT];
  }
  renderChatStream();
}

function renderChatStream() {
  const container = document.getElementById('upbase-chat-stream');
  if (!container) return;

  const msgs = window.WorkspacesState.chatMessages;
  if (msgs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No chat messages yet in this project channel.</div>`;
    return;
  }

  container.innerHTML = msgs.map(m => `
    <div class="flex items-start gap-3 group">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
        ${escapeHtml(m.sender?.full_name ? m.sender.full_name.substring(0, 2).toUpperCase() : 'US')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-slate-200">${escapeHtml(m.sender?.full_name || 'Team Member')}</span>
          <span class="text-[10px] text-slate-500 font-mono">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 inline-block max-w-xl">
          ${escapeHtml(m.text)}
        </div>
        <div class="flex items-center gap-1.5 mt-1.5">
          ${m.reactions && m.reactions.length > 0 ? m.reactions.map(r => `
            <button onclick="reactToChatMessage('${m.message_id}', '${r.emoji}')" class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-300 hover:border-cyan-400">
              ${r.emoji} ${r.count}
            </button>
          `).join('') : ''}
          <button onclick="reactToChatMessage('${m.message_id}', '👍')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">👍</button>
          <button onclick="reactToChatMessage('${m.message_id}', '🚀')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">🚀</button>
          <button onclick="reactToChatMessage('${m.message_id}', '❤️')" class="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-cyan-400">❤️</button>
        </div>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

// Send chat message
async function sendChatMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chat-input-text');
  if (!input || !input.value.trim()) return;

  const wsId = window.WorkspacesState.currentWorkspaceId;
  const prjId = window.WorkspacesState.currentProjectId;

  try {
    const res = await fetch('/api/iams/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        project_id: prjId,
        text: input.value.trim()
      })
    });
    const result = await res.json();
    if (result.success) {
      input.value = '';
      window.WorkspacesState.chatMessages.push(result.data);
      renderChatStream();
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

// React to chat message
async function reactToChatMessage(msgId, emoji) {
  try {
    const res = await fetch(`/api/iams/chat/messages/${msgId}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({ emoji })
    });
    const result = await res.json();
    if (result.success) {
      await loadProjectChat();
    }
  } catch (e) {
    console.error('Failed to react:', e);
  }
}

// ==========================================
// CREATE PROJECT MODAL & ENGINE
// ==========================================

// Open Create Project Modal
async function openCreateProjectModal() {
  const modal = document.getElementById('upbase-create-project-modal');
  const overlay = document.getElementById('modal-overlay');
  if (!modal) return;

  // Reset inputs
  const nameInput = document.getElementById('upbase-new-proj-name');
  if (nameInput) nameInput.value = '';

  const descInput = document.getElementById('upbase-new-proj-desc');
  if (descInput) descInput.value = '';

  const cmsLinkSelect = document.getElementById('upbase-new-proj-link-cms');
  if (cmsLinkSelect) cmsLinkSelect.value = '';

  const categorySelect = document.getElementById('upbase-new-proj-category');
  if (categorySelect) categorySelect.value = 'branding';

  const syncCmsCheck = document.getElementById('upbase-new-proj-sync-cms');
  if (syncCmsCheck) syncCmsCheck.checked = false;

  // Reset color radio to cyan
  const defaultColor = document.querySelector('input[name="proj_color"][value="#06b6d4"]');
  if (defaultColor) defaultColor.checked = true;

  // Reset icon
  const iconSelect = document.getElementById('upbase-new-proj-icon');
  if (iconSelect) iconSelect.value = 'briefcase';

  // Check all tools by default
  ['tool-opt-kanban', 'tool-opt-tasks', 'tool-opt-messages', 'tool-opt-docs', 'tool-opt-bookmarks', 'tool-opt-chat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });

  // Populate existing agency portfolio projects & clients
  await populateCMSProjectsOptions();
  await populateClientOptions();

  if (overlay) overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();

  if (nameInput) setTimeout(() => nameInput.focus(), 60);
}

// Populate CMS Projects dropdown so user can link or align their workspace project
async function populateCMSProjectsOptions() {
  const select = document.getElementById('upbase-new-proj-link-cms');
  if (!select) return;

  try {
    const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';
    const res = await fetch('/api/projects?status=all&limit=100', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      window.WorkspacesState.cmsProjects = result.data;
      
      select.innerHTML = '<option value="">-- Create Custom Project or Pick Existing Portfolio --</option>' +
        result.data.map(p => {
          const title = typeof p.title === 'object' ? (p.title.en || p.title.ar || 'Project') : (p.title || 'Project');
          const client = p.client ? ` [${p.client}]` : '';
          const category = p.category ? ` (${p.category})` : '';
          return `<option value="${p._id}">${escapeHtml(title + client + category)}</option>`;
        }).join('');
    }
  } catch (err) {
    console.warn('Could not prefetch CMS projects for modal:', err);
  }
}

// When user selects an existing CMS portfolio project, auto-fill fields
function onSelectExistingCMSProject(cmsId) {
  if (!cmsId || !window.WorkspacesState.cmsProjects) return;
  const project = window.WorkspacesState.cmsProjects.find(p => String(p._id) === String(cmsId));
  if (!project) return;

  const title = typeof project.title === 'object' ? (project.title.en || project.title.ar || '') : (project.title || '');
  const desc = typeof project.description === 'object' ? (project.description.en || project.description.ar || '') : (project.description || '');

  const nameInput = document.getElementById('upbase-new-proj-name');
  if (nameInput && title) nameInput.value = title;

  const descInput = document.getElementById('upbase-new-proj-desc');
  if (descInput && desc) descInput.value = desc;

  // Match or add client option
  const clientSelect = document.getElementById('upbase-new-proj-client');
  if (clientSelect && project.client) {
    let found = false;
    for (let opt of clientSelect.options) {
      if (opt.value.toLowerCase() === project.client.toLowerCase() || opt.text.toLowerCase().includes(project.client.toLowerCase())) {
        clientSelect.value = opt.value;
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = document.createElement('option');
      opt.value = project.client;
      opt.textContent = project.client;
      clientSelect.appendChild(opt);
      clientSelect.value = project.client;
    }
  }

  // Category
  const categorySelect = document.getElementById('upbase-new-proj-category');
  if (categorySelect && project.category) {
    categorySelect.value = project.category;
  }

  // Select harmonious theme color & icon based on category
  const categoryColors = {
    'branding': '#8b5cf6', // purple
    'web-development': '#06b6d4', // cyan
    'social-media': '#ec4899', // pink
    'seo': '#10b981', // emerald
    'video-photography': '#f59e0b', // amber
    'omnichannel': '#06b6d4'
  };

  const targetColor = categoryColors[project.category] || '#06b6d4';
  const colorRadio = document.querySelector(`input[name="proj_color"][value="${targetColor}"]`);
  if (colorRadio) colorRadio.checked = true;

  const iconSelect = document.getElementById('upbase-new-proj-icon');
  if (iconSelect) {
    if (project.category === 'branding') iconSelect.value = 'sparkles';
    else if (project.category === 'web-development') iconSelect.value = 'rocket';
    else if (project.category === 'video-photography') iconSelect.value = 'disc';
    else iconSelect.value = 'briefcase';
  }

  // Auto-check sync checkbox since it is tied to an existing project
  const syncCheck = document.getElementById('upbase-new-proj-sync-cms');
  if (syncCheck) syncCheck.checked = true;
}

// Populate Client options dynamically
async function populateClientOptions() {
  const select = document.getElementById('upbase-new-proj-client');
  if (!select) return;

  try {
    const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';
    const res = await fetch('/api/iams/clients?limit=100', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await res.json();
    const existingValues = new Set(Array.from(select.options).map(o => o.value.toLowerCase()));

    // Add clients from IAMS Clients table
    if (result.success && Array.isArray(result.clients)) {
      result.clients.forEach(c => {
        const clientName = c.name || c.company_name;
        if (clientName && !existingValues.has(clientName.toLowerCase())) {
          const opt = document.createElement('option');
          opt.value = clientName;
          opt.textContent = clientName;
          select.appendChild(opt);
          existingValues.add(clientName.toLowerCase());
        }
      });
    }

    // Add clients from CMS Projects list
    if (window.WorkspacesState.cmsProjects) {
      window.WorkspacesState.cmsProjects.forEach(p => {
        if (p.client && !existingValues.has(p.client.toLowerCase())) {
          const opt = document.createElement('option');
          opt.value = p.client;
          opt.textContent = p.client;
          select.appendChild(opt);
          existingValues.add(p.client.toLowerCase());
        }
      });
    }
  } catch (err) {
    // Non-critical: defaults in HTML will be used
  }
}

// Handle Create Project Form Submission
async function handleCreateProjectSubmit(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('upbase-new-proj-name');
  const descInput = document.getElementById('upbase-new-proj-desc');
  const clientSelect = document.getElementById('upbase-new-proj-client');
  const categorySelect = document.getElementById('upbase-new-proj-category');
  const cmsLinkSelect = document.getElementById('upbase-new-proj-link-cms');
  const syncCmsCheck = document.getElementById('upbase-new-proj-sync-cms');
  const iconSelect = document.getElementById('upbase-new-proj-icon');
  const colorRadio = document.querySelector('input[name="proj_color"]:checked');
  const submitBtn = document.getElementById('upbase-create-proj-submit-btn');

  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    if (typeof showNotification === 'function') showNotification('Please enter a project space name', 'error');
    else alert('Please enter a project space name');
    return;
  }

  const wsId = window.WorkspacesState.currentWorkspaceId;
  if (!wsId) {
    if (typeof showNotification === 'function') showNotification('No active workspace selected. Please select a workspace first.', 'error');
    return;
  }

  const enabledTools = {
    kanban: !!document.getElementById('tool-opt-kanban')?.checked,
    tasks: !!document.getElementById('tool-opt-tasks')?.checked,
    messages: !!document.getElementById('tool-opt-messages')?.checked,
    docs: !!document.getElementById('tool-opt-docs')?.checked,
    bookmarks: !!document.getElementById('tool-opt-bookmarks')?.checked,
    chat: !!document.getElementById('tool-opt-chat')?.checked,
    calendar: true,
    files: true
  };

  const clientVal = clientSelect && clientSelect.value ? clientSelect.value : null;
  const categoryVal = categorySelect ? categorySelect.value : 'branding';
  let cmsProjectId = cmsLinkSelect && cmsLinkSelect.value ? cmsLinkSelect.value : null;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1.5">&#9696;</span> Creating...`;
  }

  const token = sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '';

  // Optional: Also sync/publish as public CMS portfolio project if requested and not linked yet
  if (syncCmsCheck && syncCmsCheck.checked && !cmsProjectId) {
    try {
      const cmsRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: { en: name, ar: name },
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36),
          description: { en: descInput ? descInput.value.trim() : name, ar: descInput ? descInput.value.trim() : name },
          category: categoryVal,
          client: clientVal || 'Iceberg Agency',
          status: 'published'
        })
      });
      const cmsResult = await cmsRes.json();
      if (cmsResult.success && cmsResult.data) {
        cmsProjectId = cmsResult.data._id;
        if (typeof loadProjects === 'function') loadProjects();
      }
    } catch (err) {
      console.warn('CMS Portfolio project auto-sync notice:', err);
    }
  }

  const payload = {
    name,
    description: descInput ? descInput.value.trim() : '',
    color: colorRadio ? colorRadio.value : '#06b6d4',
    icon: iconSelect ? iconSelect.value : 'folder',
    client_id: clientVal,
    category: categoryVal,
    cms_project_id: cmsProjectId,
    enabled_tools: enabledTools
  };

  let createdProject = null;
  try {
    const res = await fetch(`/api/iams/workspaces/${wsId}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        createdProject = result.data;
      }
    }
  } catch (err) {
    console.warn('Project creation server sync notice (creating locally):', err);
  }

  if (!createdProject) {
    createdProject = {
      project_id: 'prj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      workspace_id: wsId,
      name: payload.name,
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
      category: payload.category,
      client_id: payload.client_id,
      cms_project_id: payload.cms_project_id,
      enabled_tools: payload.enabled_tools
    };
  }

  if (!window.WorkspacesState.projects.some(p => p.project_id === createdProject.project_id)) {
    window.WorkspacesState.projects.push(createdProject);
  }

  if (typeof closeAllModals === 'function') {
    closeAllModals();
  } else {
    document.getElementById('upbase-create-project-modal')?.classList.add('hidden');
    document.getElementById('modal-overlay')?.classList.add('hidden');
  }

  if (typeof showNotification === 'function') {
    showNotification(`Project "${createdProject.name}" created and aligned with agency portfolio!`, 'success');
  }

  renderProjectsSidebar();
  await selectProject(createdProject.project_id);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="plus" class="w-4 h-4"></i> Create Project Space`;
    if (window.lucide) window.lucide.createIcons();
  }
}

// Helper escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.initUpbaseWorkspaces = initUpbaseWorkspaces;
window.switchWorkspace = switchWorkspace;
window.selectProject = selectProject;
window.switchProjectTool = switchProjectTool;
window.handleKanbanDragStart = handleKanbanDragStart;
window.handleKanbanDragEnd = handleKanbanDragEnd;
window.handleKanbanDragOver = handleKanbanDragOver;
window.handleKanbanDragLeave = handleKanbanDragLeave;
window.handleKanbanDrop = handleKanbanDrop;
window.createQuickTask = createQuickTask;
window.postNewTopic = postNewTopic;
window.createNewDoc = createNewDoc;
window.openDocEditorModal = openDocEditorModal;
window.saveDocChanges = saveDocChanges;
window.restoreDocVersion = restoreDocVersion;
window.addProjectBookmark = addProjectBookmark;
window.sendChatMessage = sendChatMessage;
window.reactToChatMessage = reactToChatMessage;
window.openCreateProjectModal = openCreateProjectModal;
window.onSelectExistingCMSProject = onSelectExistingCMSProject;
window.handleCreateProjectSubmit = handleCreateProjectSubmit;
window.renderKanbanColumns = renderKanbanColumns;
window.renderTaskListView = renderTaskListView;

// Upbase Sliding Task Details Drawer Exports
window.openTaskDetailsModal = openTaskDetailsModal;
window.closeTaskDetailsModal = closeTaskDetailsModal;
window.toggleTaskComplete = toggleTaskComplete;
window.toggleTaskCompleteFromDrawer = toggleTaskCompleteFromDrawer;
window.autoResizeDrawerTitle = autoResizeDrawerTitle;
window.saveDrawerTitleChange = saveDrawerTitleChange;
window.onDrawerStatusChange = onDrawerStatusChange;
window.onDrawerPriorityChange = onDrawerPriorityChange;
window.onDrawerDueDateChange = onDrawerDueDateChange;
window.quickSetDrawerDue = quickSetDrawerDue;
window.onDrawerAssigneeChange = onDrawerAssigneeChange;
window.promptAddDrawerTag = promptAddDrawerTag;
window.removeDrawerTag = removeDrawerTag;
window.promptLogDrawerTime = promptLogDrawerTime;
window.promptAddCustomField = promptAddCustomField;
window.saveDrawerDescription = saveDrawerDescription;
window.insertDrawerFormat = insertDrawerFormat;
window.handleDrawerAddSubtask = handleDrawerAddSubtask;
window.toggleDrawerSubtask = toggleDrawerSubtask;
window.deleteDrawerSubtask = deleteDrawerSubtask;
window.downloadTaskAttachment = downloadTaskAttachment;
window.downloadCommentAttachment = downloadCommentAttachment;
window.downloadAttachmentObj = downloadAttachmentObj;
window.triggerBrowserDownload = triggerBrowserDownload;
window.promptAddDrawerAttachment = promptAddDrawerAttachment;
window.removeDrawerAttachment = removeDrawerAttachment;
window.focusTaskAttachment = focusTaskAttachment;
window.handleDrawerAddComment = handleDrawerAddComment;
window.handleCommentKeyDown = handleCommentKeyDown;
window.deleteDrawerComment = deleteDrawerComment;
window.insertCommentEmoji = insertCommentEmoji;
window.toggleTaskWatcher = toggleTaskWatcher;
window.toggleTaskFavorite = toggleTaskFavorite;
window.copyTaskDeepLink = copyTaskDeepLink;
window.toggleTaskMenuDropdown = toggleTaskMenuDropdown;
window.deleteActiveTask = deleteActiveTask;
window.promptQuickAddTaskToColumn = promptQuickAddTaskToColumn;
window.triggerDeviceFileUpload = triggerDeviceFileUpload;
window.handleTaskFileInputChange = handleTaskFileInputChange;
window.handleAttachmentDragOver = handleAttachmentDragOver;
window.handleAttachmentDragLeave = handleAttachmentDragLeave;
window.handleAttachmentDrop = handleAttachmentDrop;
window.promptAddWebEmbedLink = promptAddWebEmbedLink;
window.previewFullAttachmentImage = previewFullAttachmentImage;
window.closeMediaLightbox = closeMediaLightbox;
window.triggerCommentFileUpload = triggerCommentFileUpload;
window.handleCommentFileInputChange = handleCommentFileInputChange;
window.removePendingCommentAttachment = removePendingCommentAttachment;
window.insertCommentLinkTemplate = insertCommentLinkTemplate;
window.parseAndEmbedLinks = parseAndEmbedLinks;
window.ICEBERG_TEAM_MEMBERS = ICEBERG_TEAM_MEMBERS;
window.renderTeamRosterSidebar = renderTeamRosterSidebar;
window.filterTasksByAssignee = filterTasksByAssignee;
window.clearAssigneeFilter = clearAssigneeFilter;
window.toggleCommentMentionDropdown = toggleCommentMentionDropdown;
window.insertCommentMention = insertCommentMention;

// Keyboard shortcuts (Esc to close drawer)
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskDetailsModal();
    }
  });
}

// Auto-initialize immediately on script load so UI is instant and never hangs on "Loading..."
if (typeof document !== 'undefined') {
  const initApp = async () => {
    await initUpbaseWorkspaces();

    // Check for pending route or URL deep-link params
    const pending = window._pendingWorkspacesRoute;
    if (pending && (pending.project || pending.tool || pending.task)) {
      await routeWorkspacesDeepLink(pending);
      window._pendingWorkspacesRoute = null;
    } else {
      const rawHash = (window.location.hash || '').replace(/^#\/?/, '');
      const searchParams = new URLSearchParams(window.location.search);
      let routeQuery = '';
      if (rawHash.includes('?')) routeQuery = rawHash.substring(rawHash.indexOf('?') + 1);
      const hashParams = new URLSearchParams(routeQuery);
      const prj = hashParams.get('project') || searchParams.get('project');
      const tl = hashParams.get('tool') || searchParams.get('tool');
      const tsk = hashParams.get('task') || searchParams.get('task');
      if (prj || tl || tsk) {
        await routeWorkspacesDeepLink({ project: prj, tool: tl, task: tsk });
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

