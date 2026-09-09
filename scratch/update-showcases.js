const fs = require('fs');
const path = require('path');

const showcaseDir = path.join(__dirname, '..', 'public', 'showcase');
const files = fs.readdirSync(showcaseDir).filter(f => f.endsWith('.html'));

const formatClientName = (filename) => {
    const slug = filename.replace('.html', '');
    return slug.split('-').map(word => {
        if (word.toLowerCase() === 'fms') return 'FMS';
        if (word.toLowerCase() === 'scs') return 'SCS';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

files.forEach(file => {
    const filePath = path.join(showcaseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const clientName = formatClientName(file);
    const slug = file.replace('.html', '');
    const canonicalUrl = `https://icebergma.com/showcase/${file}`;

    // Extract H1 content if available
    const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : clientName.toUpperCase();

    // Generate new Head block
    const newHead = `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clientName} Case Study & Design Showcase | Iceberg Marketing Agency</title>
    <meta name="description" content="Explore Iceberg Marketing Agency's brand identity, creative execution, and digital growth showcase for ${clientName}.">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="manifest" href="/site.webmanifest">

    <!-- Open Graph / Social -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${clientName} Case Study & Design Showcase | Iceberg Marketing Agency">
    <meta property="og:description" content="Explore Iceberg Marketing Agency's brand identity and digital showcase for ${clientName}.">
    <meta property="og:image" content="https://icebergma.com/assets/og-iceberg-preview.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${clientName} Case Study & Showcase | Iceberg Marketing Agency">
    <meta name="twitter:description" content="Brand identity and creative execution for ${clientName}.">
    <meta name="twitter:image" content="https://icebergma.com/assets/og-iceberg-preview.png">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CreativeWork",
          "name": "${clientName} Brand Showcase",
          "headline": "${clientName} Case Study & Brand Identity Showcase",
          "description": "Brand identity and design assets produced by Iceberg Marketing Agency for ${clientName}.",
          "author": {
            "@type": "Organization",
            "name": "Iceberg Marketing Agency",
            "url": "https://icebergma.com"
          },
          "url": "${canonicalUrl}"
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://icebergma.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Case Studies",
              "item": "https://icebergma.com/projects.html"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "${clientName}",
              "item": "${canonicalUrl}"
            }
          ]
        }
      ]
    }
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <script src="/meta-pixel.js" defer></script>
    <style>
        body { font-family: 'Outfit', sans-serif; background-color: #020617; color: white; }
        .glass-nav { background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,0.08); }
    </style>
    <!-- Meta Pixel Code -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '2557716128012185');
    fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=2557716128012185&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->
</head>`;

    // Replace the entire head
    content = content.replace(/<head>[\s\S]*?<\/head>/i, newHead);

    // Update the Nav bar
    const newNav = `<!-- Nav -->
    <nav class="fixed top-0 w-full z-50 glass-nav px-6 py-4 flex justify-between items-center">
        <a href="/projects.html" class="flex items-center gap-2 group text-slate-300 hover:text-cyan-400 transition-colors">
            <i data-lucide="arrow-left" class="text-cyan-400 group-hover:-translate-x-1 transition-transform w-4 h-4"></i>
            <span class="font-bold tracking-widest uppercase text-xs">All Case Studies</span>
        </a>
        <a href="/" class="flex items-center gap-2 group">
            <img src="/LOGO%20(2).png" alt="Iceberg Marketing Agency Logo" class="h-6 w-auto">
            <span class="text-xl font-black italic tracking-tighter text-cyan-400">ICEBERG</span>
        </a>
    </nav>

    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="container mx-auto px-6 pt-24 -mb-16 relative z-20 flex items-center gap-2 text-xs text-slate-400">
        <a href="/" class="hover:text-cyan-400 transition-colors flex items-center gap-1"><i data-lucide="home" class="w-3.5 h-3.5"></i> Home</a>
        <span class="text-slate-600">/</span>
        <a href="/projects.html" class="hover:text-cyan-400 transition-colors">Case Studies</a>
        <span class="text-slate-600">/</span>
        <span class="text-white font-medium">${clientName}</span>
    </nav>`;

    // Replace nav
    content = content.replace(/<!-- Nav -->[\s\S]*?<\/nav>/i, newNav);

    // Improve image alt attributes: alt="..." -> alt="${clientName} Creative Work Asset ..."
    content = content.replace(/alt="([^"]*)"/g, (match, p1) => {
        if (p1.includes('Logo') || p1.includes('Pixel')) return match;
        const num = p1.match(/\d+/);
        const suffix = num ? ` ${num[0]}` : '';
        return `alt="${clientName} Brand Identity Design Showcase Asset${suffix}"`;
    });

    // Update footer with rich internal links
    const newFooter = `<!-- Footer -->
    <footer class="py-12 border-t border-white/10 text-center text-slate-400 text-xs space-y-4">
        <div class="flex items-center justify-center gap-6 font-semibold uppercase tracking-wider">
            <a href="/" class="hover:text-cyan-400 transition-colors">Home</a>
            <a href="/projects.html" class="hover:text-cyan-400 transition-colors">Case Studies</a>
            <a href="/#services" class="hover:text-cyan-400 transition-colors">Services</a>
            <a href="/#contact" class="hover:text-cyan-400 transition-colors">Contact</a>
        </div>
        <p>&copy; 2026 Iceberg Marketing Agency. All rights reserved.</p>
    </footer>`;

    content = content.replace(/<!-- Footer -->[\s\S]*?<\/footer>/i, newFooter);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated showcase: ${file}`);
});
