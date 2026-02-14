const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const showcasesDir = path.join(publicDir, 'assets/showcases');
const outputFile = path.join(publicDir, 'projects.html');

// Custom details for specific clients
const customClients = {
    'fms': {
        title: 'FMS',
        category: 'Branding & Videography and Ads Management',
        image: '30.png'
    },
    'drum-shop-egypt': {
        title: 'The Drum Shop Egypt',
        category: 'Branding & Videography and Ads Management',
        image: '8.png'
    },
    'dentaquick': {
        title: 'Dentaquick',
        category: 'Branding & Videography and Ads Management',
        image: '14.png'
    },
    'ghost-note': {
        title: 'Ghost Note',
        category: 'Branding & Videography and Ads Management',
        image: '18.png'
    },
    'crown-eterna': {
        title: 'Crown Eterna',
        category: 'Branding & Videography and Ads Management',
        image: '73.png'
    },
    'scs': {
        title: 'SCS',
        category: 'Branding & Videography and Ads Management',
        image: '28.png'
    }
};

// Helper: Slug to Title Case
const toTitleCase = (slug) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const generateProjectsPage = () => {
    try {
        const dirs = fs.readdirSync(showcasesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`Found ${dirs.length} client folders.`);

        const cardsHtml = dirs.map(slug => {
            const clientPath = path.join(showcasesDir, slug);
            let title = toTitleCase(slug);
            let category = 'Featured Client';
            let imagePath = '';

            // Check for custom details
            if (customClients[slug]) {
                const custom = customClients[slug];
                title = custom.title;
                category = custom.category;

                // Verify custom image exists
                if (fs.existsSync(path.join(clientPath, custom.image))) {
                    imagePath = `/assets/showcases/${slug}/${custom.image}`;
                }
            }

            // Fallback: Find first valid image if no custom image or custom image not found
            if (!imagePath) {
                const files = fs.readdirSync(clientPath);
                const imageFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
                if (imageFile) {
                    imagePath = `/assets/showcases/${slug}/${imageFile}`;
                } else {
                    console.warn(`No image found for ${slug}`);
                    return ''; // Skip if no image
                }
            }

            return `
                <!-- ${title} -->
                <a href="/showcase/${slug}.html" class="portfolio-item relative rounded-3xl overflow-hidden aspect-video group shadow-2xl cursor-pointer border border-white/5">
                    <img src="${imagePath}" class="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" alt="${title}">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end">
                        <span class="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">${category}</span>
                        <h4 class="text-3xl font-black italic tracking-tighter text-white">${title}</h4>
                    </div>
                </a>`;
        }).join('\n');

        const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projects | Iceberg</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">

    <!-- Libraries -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <link rel="stylesheet" href="/parallax/style.css">
</head>

<body class="bg-[#020617] text-white overflow-x-hidden antialiased">

    <!-- Header -->
    <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
        <div class="flex items-center gap-3">
            <a href="/parallax/index.html" class="flex items-center gap-2 group">
                <i data-lucide="arrow-left" class="text-cyan-400 group-hover:-translate-x-1 transition-transform"></i>
                <span class="font-bold tracking-widest uppercase text-sm">Back</span>
            </a>
        </div>
        <div class="flex items-center gap-3">
             <img src="/parallax/assets/LOGO (2).png" alt="Logo" class="h-10 w-auto">
             <span class="text-2xl font-black italic tracking-tighter text-cyan-400">ICEBERG</span>
        </div>
        <div class="w-20"></div> <!-- Spacer for balance -->
    </header>

    <!-- Hero Section -->
    <section class="relative pt-48 pb-24 px-6 container mx-auto text-center">
        <span class="text-cyan-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Our Work</span>
        <h1 class="text-5xl md:text-8xl font-black italic tracking-tighter uppercase mb-6">All Projects</h1>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">Exploring the depth of our client partnerships.</p>
    </section>

    <!-- Projects Grid -->
    <section class="pb-32 bg-[#020617] relative z-10">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-8">
                ${cardsHtml}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5 text-center bg-[#01040f]">
        <div class="flex flex-col items-center gap-6 mb-8">
            <img src="/parallax/assets/LOGO (2).png" alt="Logo"
                class="h-12 w-auto grayscale opacity-50 hover:opacity-100 transition-opacity">
        </div>
        <p class="text-gray-600 text-xs uppercase tracking-widest font-bold">&copy; 2026 Iceberg Agency. Dig Deep. Rise High.</p>
    </footer>

    <script>
        lucide.createIcons();
        
        // Simple entrance animation
        gsap.from(".portfolio-item", {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".container",
                start: "top 80%"
            }
        });
    </script>
</body>
</html>`;

        fs.writeFileSync(outputFile, htmlContent);
        console.log(`Successfully generated projects.html with ${dirs.length} projects.`);

    } catch (err) {
        console.error('Error:', err);
    }
};

generateProjectsPage();
