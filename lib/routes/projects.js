const express = require('express');
const Project = require('../models/Project');
const router = express.Router();

const DEFAULT_PROJECTS = [
  {
    _id: 'proj_1',
    title: { en: 'FMS Coffee Shop', ar: 'إف إم إس كافيه' },
    slug: 'fms-coffee-shop',
    description: { en: 'Comprehensive visual branding, menu engineering, and promotional reels.', ar: 'هوية بصرية شاملة وهندسة القوائم وتصوير ريلز دعائية.' },
    category: 'branding',
    client: 'FMS Coffee',
    technologies: ['Branding', 'Videography', 'Social Media'],
    clientLogo: 'clients-logos/fms_coffe_shop.png',
    featured: true,
    status: 'published'
  },
  {
    _id: 'proj_2',
    title: { en: 'The Drum Shop Egypt', ar: 'ذا درام شوب مصر' },
    slug: 'the-drum-shop-egypt',
    description: { en: 'Brand identity expansion and high-converting performance ads.', ar: 'توسيع الهوية التجارية وإعلانات أداء عالية التحويل.' },
    category: 'performance',
    client: 'The Drum Shop',
    technologies: ['Performance Ads', 'Media Buying', 'Content Strategy'],
    clientLogo: 'clients-logos/drum_shop_egypt.png',
    featured: true,
    status: 'published'
  },
  {
    _id: 'proj_3',
    title: { en: 'Dentaquick Dental Portal', ar: 'منصة دينتاكويك للأسنان' },
    slug: 'dentaquick-dental-portal',
    description: { en: 'Brand strategy and patient acquisition funnels for medical clinics.', ar: 'استراتيجية العلامة التجارية ومسارات اكتساب المرضى للعيادات.' },
    category: 'performance',
    client: 'Dentaquick',
    technologies: ['Lead Generation', 'Branding', 'Funnel Design'],
    clientLogo: 'clients-logos/denta_quick_.png',
    featured: true,
    status: 'published'
  },
  {
    _id: 'proj_4',
    title: { en: 'Ghost Note Music', ar: 'جوست نوت للإنتاج' },
    slug: 'ghost-note-music',
    description: { en: 'Brand positioning, artist showcase decks, and social media dominance.', ar: 'تموضع العلامة التجارية وعروض الفنانين وإدارة وسائل التواصل.' },
    category: 'social-media',
    client: 'Ghost Note',
    technologies: ['Social Media', 'Creative Direction', 'Brand Strategy'],
    clientLogo: 'clients-logos/ghost_note_.png',
    featured: true,
    status: 'published'
  },
  {
    _id: 'proj_5',
    title: { en: 'Crown Eterna', ar: 'كراون إيتيرنا' },
    slug: 'crown-eterna',
    description: { en: 'Luxury brand identity, corporate deck, and high-end video showcase.', ar: 'هوية تجارية فاخرة وعرض للشركات وتوثيق فيديو متميز.' },
    category: 'branding',
    client: 'Crown Eterna',
    technologies: ['Luxury Branding', 'Videography', 'UI/UX'],
    clientLogo: 'clients-logos/crown_eterna.png',
    featured: true,
    status: 'published'
  },
  {
    _id: 'proj_6',
    title: { en: 'Penates Real Estate Developments', ar: 'بيناتيس للتطوير العقاري' },
    slug: 'penates-real-estate',
    description: { en: 'Full corporate identity and project launch marketing campaigns.', ar: 'هوية شركات متكاملة وحملات إطلاق المشاريع العقارية.' },
    category: 'branding',
    client: 'Penates Developments',
    technologies: ['Real Estate Marketing', 'Identity Design', 'Media Buying'],
    clientLogo: 'clients-logos/penates_developments.png',
    featured: true,
    status: 'published'
  }
];

// Get all projects with filtering
router.get('/', async (req, res) => {
  try {
    const {
      category,
      featured,
      status = 'published',
      lang = 'en',
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const skip = (page - 1) * limit;

    let projects = [];
    let total = 0;

    try {
      projects = await Project.find(query)
        .sort({ featured: -1, completedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      total = await Project.countDocuments(query);
    } catch (dbErr) {
      console.warn('[Project DB Find Warn]:', dbErr.message);
    }

    if (!projects || projects.length === 0) {
      projects = DEFAULT_PROJECTS;
      if (category) projects = projects.filter(p => p.category === category);
      if (featured === 'true') projects = projects.filter(p => p.featured);
      total = projects.length;
    }

    // Transform projects based on language if not raw mode
    let data = projects;
    if (req.query.raw !== 'true') {
      data = projects.map(project => ({
        _id: project._id,
        title: (project.title && (project.title[lang] || project.title.en)) || project.title || '',
        slug: project.slug,
        description: (project.description && (project.description[lang] || project.description.en)) || project.description || '',
        category: project.category,
        client: project.client,
        technologies: project.technologies || [],
        images: project.images || [],
        featured: project.featured,
        completedDate: project.completedDate || new Date(),
        clientLogo: project.clientLogo,
        projectUrl: project.projectUrl,
        caseStudy: project.caseStudy ? (project.caseStudy[lang] || project.caseStudy.en) : null,
        results: project.results,
        seo: project.seo,
        status: project.status || 'published'
      }));
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get project by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'en' } = req.query;

    const project = await Project.findOne({ slug, status: 'published' });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const transformedProject = {
      _id: project._id,
      title: project.title[lang] || project.title.en,
      slug: project.slug,
      description: project.description[lang] || project.description.en,
      category: project.category,
      client: project.client,
      technologies: project.technologies,
      images: project.images,
      featured: project.featured,
      completedDate: project.completedDate,
      clientLogo: project.clientLogo,
      projectUrl: project.projectUrl,
      caseStudy: project.caseStudy ? (project.caseStudy[lang] || project.caseStudy.en) : null,
      results: project.results,
      seo: project.seo
    };

    res.json({
      success: true,
      data: transformedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new project (for CMS)
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update project (for CMS)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete project (for CMS)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get project categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Project.distinct('category');

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize sample projects from clients
router.post(['/initialize', '/init'], async (req, res) => {
  try {
    const Content = require('../models/Content');
    const clientContent = await Content.findOne({ key: 'gallery_clients' });

    let clients = [];
    if (clientContent && clientContent.value && clientContent.value.en) {
      try {
        clients = JSON.parse(clientContent.value.en);
      } catch (e) {
        console.error('Error parsing clients JSON:', e);
      }
    }

    const projectsToCreate = [];

    // Add legacy sample projects first
    const legacyProjects = [
      {
        title: { en: 'Neon Energy Drink', ar: 'مشروب الطاقة النيون' },
        slug: 'neon-energy-drink',
        description: { en: 'Full brand launch strategy covering Instagram & TikTok.', ar: 'استراتيجية إطلاق علامة تجارية كاملة.' },
        category: 'social-media',
        client: 'Neon Beverages Inc.',
        featured: true,
        completedDate: new Date('2024-01-15'),
        status: 'published'
      }
    ];
    projectsToCreate.push(...legacyProjects);

    // Create projects for each client logo
    if (clients && Array.isArray(clients)) {
      clients.forEach((logoUrl, index) => {
        const clientName = logoUrl.split('/').pop().split('.')[0].replace(/[-_]/g, ' ').toUpperCase();
        projectsToCreate.push({
          title: {
            en: `${clientName} Digital Evolution`,
            ar: `التطور الرقمي لـ ${clientName}`
          },
          slug: `client-project-${index}`,
          description: {
            en: `Strategic digital transformation and brand expansion for ${clientName}.`,
            ar: `التحول الرقمي الاستراتيجي وتوسيع العلامة التجارية لـ ${clientName}.`
          },
          category: 'branding',
          client: clientName,
          clientLogo: logoUrl,
          technologies: ['Branding', 'Digital Strategy', 'UI/UX'],
          featured: index < 6, // Feature first 6
          completedDate: new Date(),
          status: 'published'
        });
      });
    }

    for (const project of projectsToCreate) {
      await Project.findOneAndUpdate(
        { slug: project.slug },
        project,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Projects initialized successfully with client logos',
      count: projectsToCreate.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
