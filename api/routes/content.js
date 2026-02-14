const express = require('express');
const Content = require('../models/Content');
const router = express.Router();

// Get all content or filtered by category
router.get('/', async (req, res) => {
  try {
    const { category, lang = 'en' } = req.query;

    let query = {};
    if (category) {
      query.category = category;
    }

    const contents = await Content.find(query).sort({ category: 1, key: 1 });

    // Transform content based on language
    const transformedContent = {};
    contents.forEach(content => {
      transformedContent[content.key] = content.value[lang] || content.value.en;
    });

    res.json({
      success: true,
      data: transformedContent,
      total: contents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get content by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { lang = 'en' } = req.query;

    const content = await Content.findOne({ key });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: {
        key: content.key,
        value: content.value[lang] || content.value.en,
        type: content.type,
        category: content.category
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new content (for CMS)
router.post('/', async (req, res) => {
  try {
    const { key, value, type, category } = req.body;

    // Check if content already exists
    const existingContent = await Content.findOne({ key });
    if (existingContent) {
      return res.status(400).json({
        success: false,
        error: 'Content with this key already exists'
      });
    }

    const content = new Content({
      key,
      value,
      type,
      category,
      modifiedBy: req.user?.id || 'anonymous'
    });

    await content.save();

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update content (for CMS)
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category } = req.body;

    const content = await Content.findOneAndUpdate(
      { key },
      {
        value,
        type,
        category,
        lastModified: new Date(),
        modifiedBy: req.user?.id || 'anonymous'
      },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete content (for CMS)
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const content = await Content.findOneAndDelete({ key });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize default content
router.post('/initialize', async (req, res) => {
  try {
    const defaultContent = [
      // Navigation
      { key: 'nav_services', value: { en: 'Services', ar: 'خدماتنا' }, category: 'navigation' },
      { key: 'nav_process', value: { en: 'Process', ar: 'كيف نعمل' }, category: 'navigation' },
      { key: 'nav_work', value: { en: 'Work', ar: 'أعمالنا' }, category: 'navigation' },
      { key: 'nav_about', value: { en: 'About', ar: 'عن الشركة' }, category: 'navigation' },
      { key: 'nav_contact', value: { en: 'Contact', ar: 'تواصل معنا' }, category: 'navigation' },

      // Hero Section
      { key: 'hero_badge', value: { en: 'DIGITAL GROWTH AGENCY', ar: 'وكالة نمو رقمي' }, category: 'hero' },
      { key: 'hero_title_1', value: { en: 'We Reveal Your', ar: 'نحن نكشف عن' }, category: 'hero' },
      { key: 'hero_title_2', value: { en: 'Hidden Potential.', ar: 'إمكاناتك الكامنة.' }, category: 'hero' },
      { key: 'hero_subtitle', value: { en: 'Like an iceberg, your brand has depth. We help you showcase the massive value lying beneath the surface.', ar: 'مثل الجبل الجليدي، علامتك التجارية لها عمق. نحن نساعدك على إظهار القيمة الهائلة الكامنة تحت السطح.' }, category: 'hero' },

      // Contact
      { key: 'contact_title', value: { en: "Let's Break the Ice", ar: 'لنكسر الجليد' }, category: 'contact' },
      { key: 'contact_sub', value: { en: 'Ready to grow? Send us a message.', ar: 'مستعد للنمو؟ أرسل لنا رسالة.' }, category: 'contact' },

      // Showcase & Clients (Galleries)
      {
        key: 'gallery_showcase',
        value: {
          en: JSON.stringify([
            'showcases/drum_shop_branding.png',
            'showcases/drum_shop_egypt_showcase_2.png',
            'showcases/drum_shop_egypt_showcase_reels.png',
            'showcases/fms_cofe_shop_branding_showcase_.png',
            'showcases/fms_cofeshop_showcase_1.png',
            'showcases/ghost_note_showcase_1.png',
            'showcases/penates_realestate_devlopments_showcase_2.png',
            'showcases/penates_realestate_devlopments_showcase_reels_.png',
            'showcases/sahel_construction_solutions_branding_showcase.png',
            'showcases/dentaquick_showcase_1.png'
          ]),
          ar: JSON.stringify([
            'showcases/drum_shop_branding.png',
            'showcases/drum_shop_egypt_showcase_2.png',
            'showcases/drum_shop_egypt_showcase_reels.png',
            'showcases/fms_cofe_shop_branding_showcase_.png',
            'showcases/fms_cofeshop_showcase_1.png',
            'showcases/ghost_note_showcase_1.png',
            'showcases/penates_realestate_devlopments_showcase_2.png',
            'showcases/penates_realestate_devlopments_showcase_reels_.png',
            'showcases/sahel_construction_solutions_branding_showcase.png',
            'showcases/dentaquick_showcase_1.png'
          ])
        },
        type: 'json',
        category: 'showcase'
      },
      {
        key: 'gallery_clients',
        value: {
          en: JSON.stringify([
            'clients-logos/crown_eterna.png',
            'clients-logos/denta_quick_.png',
            'clients-logos/drum_shop_egypt.png',
            'clients-logos/fms_coffe_shop.png',
            'clients-logos/ghost_note_.png',
            'clients-logos/lazy_pajama.png',
            'clients-logos/nelo_merkato.png',
            'clients-logos/penates_developments.png',
            'clients-logos/pronto_book_store.png',
            'clients-logos/remondas_store.png',
            'clients-logos/the_call_for_worship.png'
          ]),
          ar: JSON.stringify([
            'clients-logos/crown_eterna.png',
            'clients-logos/denta_quick_.png',
            'clients-logos/drum_shop_egypt.png',
            'clients-logos/fms_coffe_shop.png',
            'clients-logos/ghost_note_.png',
            'clients-logos/lazy_pajama.png',
            'clients-logos/nelo_merkato.png',
            'clients-logos/penates_developments.png',
            'clients-logos/pronto_book_store.png',
            'clients-logos/remondas_store.png',
            'clients-logos/the_call_for_worship.png'
          ])
        },
        type: 'json',
        category: 'clients'
      }
    ];

    for (const content of defaultContent) {
      await Content.findOneAndUpdate(
        { key: content.key },
        content,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Default content initialized successfully',
      count: defaultContent.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
