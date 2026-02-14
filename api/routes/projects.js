const express = require('express');
const Project = require('../models/Project');
const router = express.Router();

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

    let query = { status };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .sort({ featured: -1, completedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform projects based on language if not raw mode
    let data = projects;
    if (req.query.raw !== 'true') {
      data = projects.map(project => ({
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
        seo: project.seo,
        status: project.status
      }));
    }

    const total = await Project.countDocuments(query);
    console.log(`API [GET /projects]: Found ${projects.length} / ${total}`);

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
router.post('/initialize', async (req, res) => {
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
