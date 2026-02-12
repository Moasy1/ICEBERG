const express = require('express');
const Service = require('../models/Service');
const router = express.Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const {
      featured,
      status = 'published',
      lang = 'en'
    } = req.query;

    let query = { status };

    if (featured === 'true') query.featured = true;

    const services = await Service.find(query).sort({ order: 1, title: 1 });

    // Transform services based on language if not raw
    let data = services;
    if (req.query.raw !== 'true') {
      data = services.map(service => ({
        _id: service._id,
        title: service.title[lang] || service.title.en,
        slug: service.slug,
        description: service.description[lang] || service.description.en,
        shortDescription: service.shortDescription[lang] || service.shortDescription.en,
        icon: service.icon,
        iconColor: service.iconColor,
        features: service.features.map(feature => ({
          title: feature.title[lang] || feature.title.en,
          description: feature.description ? (feature.description[lang] || feature.description.en) : null
        })),
        featured: service.featured,
        order: service.order,
        seo: service.seo,
        status: service.status
      }));
    }

    res.json({
      success: true,
      data,
      total: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get service by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'en' } = req.query;

    const service = await Service.findOne({ slug, status: 'published' });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    const transformedService = {
      _id: service._id,
      title: service.title[lang] || service.title.en,
      slug: service.slug,
      description: service.description[lang] || service.description.en,
      shortDescription: service.shortDescription[lang] || service.shortDescription.en,
      icon: service.icon,
      iconColor: service.iconColor,
      features: service.features.map(feature => ({
        title: feature.title[lang] || feature.title.en,
        description: feature.description ? (feature.description[lang] || feature.description.en) : null
      })),
      pricing: service.pricing ? {
        basic: service.pricing.basic ? {
          title: service.pricing.basic.title[lang] || service.pricing.basic.title.en,
          price: service.pricing.basic.price,
          features: service.pricing.basic.features.map(f => f[lang] || f.en)
        } : null,
        professional: service.pricing.professional ? {
          title: service.pricing.professional.title[lang] || service.pricing.professional.title.en,
          price: service.pricing.professional.price,
          features: service.pricing.professional.features.map(f => f[lang] || f.en)
        } : null,
        enterprise: service.pricing.enterprise ? {
          title: service.pricing.enterprise.title[lang] || service.pricing.enterprise.title.en,
          price: service.pricing.enterprise.price,
          features: service.pricing.enterprise.features.map(f => f[lang] || f.en)
        } : null
      } : null,
      featured: service.featured,
      order: service.order,
      seo: service.seo
    };

    res.json({
      success: true,
      data: transformedService
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new service (for CMS)
router.post('/', async (req, res) => {
  try {
    const serviceData = req.body;

    const service = new Service(serviceData);
    await service.save();

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update service (for CMS)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete service (for CMS)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize sample services
router.post('/initialize', async (req, res) => {
  try {
    const sampleServices = [
      {
        title: {
          en: 'SEO & Visibility',
          ar: 'تحسين محركات البحث'
        },
        slug: 'seo-visibility',
        description: {
          en: 'Get found by the right people. We optimize your structure deep down to dominate search results and increase your organic traffic significantly.',
          ar: 'اجعل عملاءك يجدونك بسهولة. نحن نحسن هيكل موقعك للسيطرة على نتائج البحث وزيادة حركة المرور العضوية بشكل كبير.'
        },
        shortDescription: {
          en: 'Get found by the right people. We optimize your structure deep down to dominate search results.',
          ar: 'اجعل عملاءك يجدونك بسهولة. نحن نحسن هيكل موقعك للسيطرة على نتائج البحث.'
        },
        icon: 'search',
        iconColor: 'blue',
        featured: true,
        order: 1,
        status: 'published'
      },
      {
        title: {
          en: 'Social Media',
          ar: 'التسويق الاجتماعي'
        },
        slug: 'social-media',
        description: {
          en: 'Engaging content that floats to the top of the feed. Build a loyal community around your brand with our strategic social media management.',
          ar: 'محتوى جذاب يطفو على قمة المنشورات. ابني مجتمعاً مخلصاً حول علامتك التجارية مع إدارتنا الاستراتيجية للوسائط الاجتماعية.'
        },
        shortDescription: {
          en: 'Engaging content that floats to the top of the feed. Build a loyal community around your brand.',
          ar: 'محتوى جذاب يطفو على قمة المنشورات. ابني مجتمعاً مخلصاً حول علامتك التجارية.'
        },
        icon: 'megaphone',
        iconColor: 'cyan',
        featured: true,
        order: 2,
        status: 'published'
      },
      {
        title: {
          en: 'Web Development',
          ar: 'تطوير المواقع'
        },
        slug: 'web-development',
        description: {
          en: 'Fast, secure, and beautiful websites built on solid foundations, just like an iceberg. We create digital experiences that convert.',
          ar: 'مواقع سريعة وآمنة وجميلة مبنية على أسس متينة، تماماً مثل الجبل الجليدي. نحن نخلق تجارب رقمية تحول.'
        },
        shortDescription: {
          en: 'Fast, secure, and beautiful websites built on solid foundations, just like an iceberg.',
          ar: 'مواقع سريعة وآمنة وجميلة مبنية على أسس متينة، تماماً مثل الجبل الجليدي.'
        },
        icon: 'code',
        iconColor: 'purple',
        featured: true,
        order: 3,
        status: 'published'
      }
    ];

    for (const service of sampleServices) {
      await Service.findOneAndUpdate(
        { slug: service.slug },
        service,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Sample services initialized successfully',
      count: sampleServices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
