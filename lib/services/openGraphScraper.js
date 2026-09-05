/**
 * OpenGraph Link Scraper Service
 * Resolves metadata (og:title, og:description, og:image, favicon, site_name) from any URL
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class OpenGraphScraper {
  /**
   * Scrapes metadata from target URL with timeout and fallback defaults
   * @param {string} targetUrl 
   * @param {number} timeoutMs 
   * @returns {Promise<{ url: string, title: string, description: string, image: string, favicon: string, domain: string }>}
   */
  static async scrape(targetUrl, timeoutMs = 4000) {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    const domain = parsedUrl.hostname.replace(/^www\./, '');
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    return new Promise((resolve) => {
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IcebergBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, (res) => {
        // Follow one redirect level if status 301/302
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          try {
            const redirectUrl = new URL(res.headers.location, targetUrl).href;
            return this.scrape(redirectUrl, timeoutMs).then(resolve).catch(() => {
              resolve(this._getFallback(targetUrl, domain, defaultFavicon));
            });
          } catch (e) {
            return resolve(this._getFallback(targetUrl, domain, defaultFavicon));
          }
        }

        if (res.statusCode !== 200) {
          return resolve(this._getFallback(targetUrl, domain, defaultFavicon));
        }

        let html = '';
        res.setEncoding('utf8');
        
        res.on('data', (chunk) => {
          html += chunk;
          // Stop parsing after 100KB to save memory and CPU
          if (html.length > 100000) {
            req.destroy();
          }
        });

        res.on('end', () => {
          const meta = this._parseHtmlMetadata(html, targetUrl, domain, defaultFavicon);
          resolve(meta);
        });

        res.on('close', () => {
          const meta = this._parseHtmlMetadata(html, targetUrl, domain, defaultFavicon);
          resolve(meta);
        });
      });

      req.on('error', () => {
        resolve(this._getFallback(targetUrl, domain, defaultFavicon));
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve(this._getFallback(targetUrl, domain, defaultFavicon));
      });
    });
  }

  static _parseHtmlMetadata(html, targetUrl, domain, defaultFavicon) {
    const getTagContent = (regex) => {
      const match = html.match(regex);
      return match ? match[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : '';
    };

    // OpenGraph and Meta tags
    const ogTitle = getTagContent(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                    getTagContent(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i) ||
                    getTagContent(/<title[^>]*>(.*?)<\/title>/i) ||
                    domain;

    const ogDescription = getTagContent(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                          getTagContent(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                          getTagContent(/<meta\s+name=["']twitter:description["']\s+content=["'](.*?)["']/i) ||
                          '';

    let ogImage = getTagContent(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                  getTagContent(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
                  '';

    // Resolve relative image URLs
    if (ogImage && !ogImage.startsWith('http')) {
      try {
        ogImage = new URL(ogImage, targetUrl).href;
      } catch (e) {
        ogImage = '';
      }
    }

    return {
      url: targetUrl,
      title: ogTitle.substring(0, 200),
      description: ogDescription.substring(0, 400),
      image: ogImage,
      favicon: defaultFavicon,
      domain: domain
    };
  }

  static _getFallback(url, domain, favicon) {
    return {
      url,
      title: domain,
      description: `Link to ${domain}`,
      image: '',
      favicon,
      domain
    };
  }
}

module.exports = OpenGraphScraper;
