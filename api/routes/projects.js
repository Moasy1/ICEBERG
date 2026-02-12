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
        projectUrl: project.projectUrl,
        caseStudy: project.caseStudy ? (project.caseStudy[lang] || project.caseStudy.en) : null,
        results: project.results,
        seo: project.seo,
        status: project.status
      }));
    }

    const total = await Project.countDocuments(query);

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

// Initialize sample projects
router.post('/initialize', async (req, res) => {
  try {
    const sampleProjects = [
      {
        title: {
          en: 'Neon Energy Drink',
          ar: 'مشروب الطاقة النيون'
        },
        slug: 'neon-energy-drink',
        description: {
          en: 'Full brand launch strategy covering Instagram & TikTok with explosive results.',
          ar: 'استراتيجية إطلاق علامة تجارية كاملة تغطي انستغرام وتيك توك بنتائج مذهلة.'
        },
        category: 'social-media',
        client: 'Neon Beverages Inc.',
        technologies: ['Instagram', 'TikTok', 'Content Strategy', 'Influencer Marketing'],
        featured: true,
        completedDate: new Date('2024-01-15'),
        results: {
          roiIncrease: 250,
          trafficIncrease: 400,
          conversionRate: 8.5
        },
        status: 'published'
      },
      {
        title: {
          en: 'FinTech Global',
          ar: 'فينتك العالمية'
        },
        slug: 'fintech-global',
        description: {
          en: 'High-performance React website with 3D elements and real-time data visualization.',
          ar: 'موقع React عالي الأداء مع عناصر ثلاثية الأبعاد وتصور البيانات في الوقت الفعلي.'
        },
        category: 'web-development',
        client: 'FinTech Global Ltd.',
        technologies: ['React', 'Three.js', 'Node.js', 'MongoDB'],
        featured: true,
        completedDate: new Date('2024-02-20'),
        results: {
          roiIncrease: 180,
          trafficIncrease: 300,
          conversionRate: 12.3
        },
        status: 'published'
      },
      {
        title: {
          en: 'Urban Fashion',
          ar: 'الأزياء الحضرية'
        },
        slug: 'urban-fashion',
        description: {
          en: 'SEO and Google Ads campaign that tripled online sales in 6 months.',
          ar: 'حملة SEO وإعلانات جوجل التي ضاعفت المبيعات عبر الإنترنت 3 مرات في 6 أشهر.'
        },
        category: 'seo',
        client: 'Urban Fashion Store',
        technologies: ['Google Ads', 'SEO', 'Analytics', 'Conversion Optimization'],
        featured: false,
        completedDate: new Date('2024-03-10'),
        results: {
          roiIncrease: 300,
          trafficIncrease: 250,
          conversionRate: 6.8
        },
        status: 'published'
      }
    ];

    for (const project of sampleProjects) {
      await Project.findOneAndUpdate(
        { slug: project.slug },
        project,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Sample projects initialized successfully',
      count: sampleProjects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
