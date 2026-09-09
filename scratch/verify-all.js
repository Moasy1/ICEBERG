const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
let errors = [];
let checkedPages = 0;

function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // Skip admin and test dirs for consumer SEO checks
            if (!filePath.includes('admin') && !filePath.includes('scratch') && !filePath.includes('IDEX Event')) {
                getAllHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const htmlFiles = getAllHtmlFiles(publicDir);

console.log(`Auditing ${htmlFiles.length} consumer-facing HTML files...`);

const titlesSeen = new Map();

htmlFiles.forEach(file => {
    const relPath = path.relative(publicDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    checkedPages++;

    // 1. Check Title
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
    if (!titleMatch) {
        errors.push(`[${relPath}] Missing <title> tag`);
    } else {
        const title = titleMatch[1].trim();
        if (/vite/i.test(title)) errors.push(`[${relPath}] Title mentions Vite: "${title}"`);
        if (/react/i.test(title)) errors.push(`[${relPath}] Title mentions React: "${title}"`);
        if (titlesSeen.has(title)) {
            errors.push(`[${relPath}] Duplicate title found: "${title}" (already used in ${titlesSeen.get(title)})`);
        } else {
            titlesSeen.set(title, relPath);
        }
    }

    // 2. Check Meta Description
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
    if (!descMatch && !relPath.includes('assets/index.html')) {
        errors.push(`[${relPath}] Missing <meta name="description">`);
    }

    // 3. Check Canonical Tag
    const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/i);
    if (!canonMatch) {
        errors.push(`[${relPath}] Missing canonical tag`);
    } else if (!canonMatch[1].startsWith('https://icebergma.com')) {
        errors.push(`[${relPath}] Canonical URL not on custom domain: ${canonMatch[1]}`);
    }

    // 4. Check H1 Heading count (should be strictly 1)
    if (!relPath.includes('assets/index.html')) {
        const h1Matches = content.match(/<h1[\s>]/gi);
        const h1Count = h1Matches ? h1Matches.length : 0;
        if (h1Count === 0) {
            errors.push(`[${relPath}] No <h1> heading found`);
        } else if (h1Count > 1) {
            errors.push(`[${relPath}] Multiple <h1> headings found (${h1Count})`);
        }
    }

    // 5. Check Favicons
    if (!relPath.includes('assets/index.html')) {
        if (!content.includes('/favicon.svg') && !content.includes('/favicon.ico')) {
            errors.push(`[${relPath}] Missing favicon references`);
        }
    }

    // 6. Check Default Placeholders in user-facing forms
    if (/placeholder=["']Acme Inc\.?["']/i.test(content)) {
        errors.push(`[${relPath}] Contains placeholder="Acme Inc."`);
    }
    if (/placeholder=["']john@example\.com["']/i.test(content)) {
        errors.push(`[${relPath}] Contains placeholder="john@example.com"`);
    }
    if (/placeholder=["']https:\/\/example\.com["']/i.test(content)) {
        errors.push(`[${relPath}] Contains placeholder="https://example.com"`);
    }
    if (/placeholder=["']John Doe["']/i.test(content)) {
        errors.push(`[${relPath}] Contains placeholder="John Doe"`);
    }

    // 7. Check broken links
    if (/birthday-campaig-OFFERS/.test(content)) {
        errors.push(`[${relPath}] Contains broken link 'birthday-campaig-OFFERS'`);
    }
    if (/href=["']\/parallax\/index\.html["']/.test(content)) {
        errors.push(`[${relPath}] Contains deprecated link '/parallax/index.html' instead of '/'`);
    }
});

// Check Critical SEO files existence
const criticalFiles = ['CNAME', 'robots.txt', 'sitemap.xml', 'llms.txt', '404.html', 'favicon.svg', 'favicon.ico', 'site.webmanifest', 'assets/og-iceberg-preview.png'];
criticalFiles.forEach(cf => {
    const p = path.join(publicDir, cf);
    if (!fs.existsSync(p)) {
        errors.push(`Missing critical static file: ${cf}`);
    } else {
        console.log(`Verified file exists: ${cf}`);
    }
});

console.log(`\nVerification Summary:`);
console.log(`Total Pages Inspected: ${checkedPages}`);
console.log(`Total Errors Detected: ${errors.length}`);

if (errors.length > 0) {
    console.error('\nErrors Found:');
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
} else {
    console.log('\nALL CHECKS PASSED PERFECTLY!');
    process.exit(0);
}
