/**
 * Sitemap Generation Script
 * Run with: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const baseUrl = process.env.SITE_URL || 'https://hopin.app';
const lastmod = new Date().toISOString().split('T')[0];

// Public pages that should be indexed
const publicPages = [
  { url: '/', priority: 1.0, frequency: 'daily' },
  { url: '/about', priority: 0.8, frequency: 'monthly' },
  { url: '/blog', priority: 0.7, frequency: 'weekly' },
  { url: '/careers', priority: 0.6, frequency: 'monthly' },
  { url: '/cities', priority: 0.8, frequency: 'monthly' },
  { url: '/contact', priority: 0.7, frequency: 'weekly' },
  { url: '/faq', priority: 0.7, frequency: 'monthly' },
  { url: '/privacy', priority: 0.5, frequency: 'yearly' },
  { url: '/safety', priority: 0.8, frequency: 'monthly' },
  { url: '/terms', priority: 0.5, frequency: 'yearly' },
  { url: '/login', priority: 0.6, frequency: 'weekly' },
];

function generateSitemap() {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const urlsetClose = '</urlset>';

  const urls = publicPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.frequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  return xmlHeader + urlsetOpen + urls + '\n' + urlsetClose;
}

function generateSitemapIndex() {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const sitemapIndexOpen =
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const sitemapIndexClose = '</sitemapindex>';

  const sitemaps = `
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;

  return xmlHeader + sitemapIndexOpen + sitemaps + '\n' + sitemapIndexClose;
}

// Generate main sitemap
const sitemap = generateSitemap();
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');

fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`✅ Sitemap generated: ${sitemapPath}`);

// Generate blog sitemap (placeholder)
const blogSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Blog posts will be added dynamically -->
</urlset>`;

const blogSitemapPath = path.join(__dirname, '../public/sitemap-blog.xml');
fs.writeFileSync(blogSitemapPath, blogSitemap, 'utf8');
console.log(`✅ Blog sitemap template generated: ${blogSitemapPath}`);

// Generate sitemap index
const sitemapIndex = generateSitemapIndex();
const sitemapIndexPath = path.join(__dirname, '../public/sitemap-index.xml');
fs.writeFileSync(sitemapIndexPath, sitemapIndex, 'utf8');
console.log(`✅ Sitemap index generated: ${sitemapIndexPath}`);
