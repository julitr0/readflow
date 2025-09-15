/**
 * URL extraction and content fetching utilities
 * Shared module for extracting URLs from emails and fetching content
 */

/**
 * Extract URLs from email content
 * Supports both plain text URLs and HTML anchor tags
 */
export function extractLinksFromEmail(htmlContent: string): string[] {
  const urls: string[] = [];
  
  // Extract URLs from anchor tags
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = anchorRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (isValidNewsletterUrl(url)) {
      urls.push(url);
    }
  }
  
  // Extract plain text URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  while ((match = urlRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    if (isValidNewsletterUrl(url) && !urls.includes(url)) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Check if URL is from a supported newsletter platform
 */
function isValidNewsletterUrl(url: string): boolean {
  const supportedDomains = [
    'substack.com',
    'medium.com',
    'convertkit.com',
    'beehiiv.com',
    'buttondown.email',
    'ghost.io',
    'revue.co',
    'tinyletter.com'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

/**
 * Extract content from a newsletter URL
 * Returns HTML content, title, author, and source
 */
export async function extractContentFromURL(url: string): Promise<{
  html: string;
  title: string;
  author: string;
  source: string;
} | null> {
  try {
    console.log('Fetching URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML length:', html.length);
    
    // Extract metadata from HTML
    const title = extractTitle(html);
    const author = extractAuthor(html);
    const source = extractSource(url);

    console.log('Extracted metadata:', { title, author, source });

    // Clean the HTML content based on the platform
    const cleanedHtml = cleanNewsletterHTML(html, url);
    console.log('Cleaned HTML length:', cleanedHtml.length);

    return {
      html: cleanedHtml,
      title,
      author,
      source
    };

  } catch (error) {
    console.error('Error extracting content from URL:', error);
    return null;
  }
}

function extractTitle(html: string): string {
  // Try to extract title from various meta tags
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim();
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return "Extracted Article";
}

function extractAuthor(html: string): string {
  // Try to extract author from various meta tags
  const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/i);
  if (authorMatch) {
    return authorMatch[1].trim();
  }

  const ogAuthorMatch = html.match(/<meta[^>]*property="article:author"[^>]*content="([^"]+)"/i);
  if (ogAuthorMatch) {
    return ogAuthorMatch[1].trim();
  }

  // Try to find author in Substack-specific elements
  const substackAuthorMatch = html.match(/<a[^>]*class="[^"]*author-name[^"]*"[^>]*>([^<]+)<\/a>/i);
  if (substackAuthorMatch) {
    return substackAuthorMatch[1].trim();
  }

  return "Unknown Author";
}

function extractSource(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return "Web Article";
  }
}

function cleanNewsletterHTML(html: string, url: string): string {
  if (url.includes('substack.com')) {
    return cleanSubstackHTML(html);
  } else if (url.includes('medium.com')) {
    return cleanMediumHTML(html);
  }
  
  // Default cleaning for other platforms
  return cleanGenericHTML(html);
}

function cleanSubstackHTML(html: string): string {
  // Modern Substack uses various class patterns for content
  // Try multiple selectors to find the main content
  
  // Remove script and style tags first
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Try modern Substack post content selectors
  const contentSelectors = [
    // Modern Substack post content
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*available-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Try article tag
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Try main content area
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    // Generic content div
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];
  
  for (const selector of contentSelectors) {
    const match = cleaned.match(selector);
    if (match && match[1].trim().length > 1000) { // Ensure we got substantial content
      console.log(`Substack content extracted using selector, length: ${match[1].length}`);
      return sanitizeHtmlForKindle(match[1]);
    }
  }
  
  // If specific selectors fail, try to find content between common Substack patterns
  // Look for content after typical Substack header patterns and before footer
  const contentPattern = /<h1[^>]*>[\s\S]*?<\/h1>([\s\S]*?)(?:<footer|<div[^>]*class="[^"]*footer|$)/i;
  const contentMatch = cleaned.match(contentPattern);
  if (contentMatch && contentMatch[1].trim().length > 1000) {
    console.log(`Substack content extracted using h1 pattern, length: ${contentMatch[1].length}`);
    return sanitizeHtmlForKindle(contentMatch[1]);
  }
  
  // Last resort: return body content but remove common non-content elements
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    let bodyContent = bodyMatch[1];
    // Remove navigation, headers, footers, and other non-content elements
    bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    bodyContent = bodyContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*nav[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    console.log(`Substack content extracted from body (filtered), length: ${bodyContent.length}`);
    return sanitizeHtmlForKindle(bodyContent);
  }

  console.log(`Substack content extraction fallback, returning full HTML, length: ${cleaned.length}`);
  return sanitizeHtmlForKindle(cleaned);
}

function cleanMediumHTML(html: string): string {
  // Extract the main article content from Medium HTML
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return sanitizeHtmlForKindle(articleMatch[1]);
  }

  // Try to find main content area
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return sanitizeHtmlForKindle(mainMatch[1]);
  }

  return sanitizeHtmlForKindle(html);
}

function cleanGenericHTML(html: string): string {
  // Generic HTML cleaning
  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Try to extract main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return sanitizeHtmlForKindle(articleMatch[1]);
  }

  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return sanitizeHtmlForKindle(mainMatch[1]);
  }

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return sanitizeHtmlForKindle(bodyMatch[1]);
  }

  return sanitizeHtmlForKindle(cleaned);
}

/**
 * Sanitize HTML content to be more compatible with Calibre
 * Removes problematic elements and attributes that can cause conversion issues
 */
function sanitizeHtmlForKindle(html: string): string {
  let sanitized = html;
  
  // Remove problematic attributes that can cause Calibre issues
  sanitized = sanitized.replace(/\s+style="[^"]*"/gi, ''); // Remove inline styles
  sanitized = sanitized.replace(/\s+class="[^"]*"/gi, ''); // Remove class attributes
  sanitized = sanitized.replace(/\s+id="[^"]*"/gi, ''); // Remove id attributes
  sanitized = sanitized.replace(/\s+data-[^=]*="[^"]*"/gi, ''); // Remove data attributes
  sanitized = sanitized.replace(/\s+aria-[^=]*="[^"]*"/gi, ''); // Remove aria attributes
  sanitized = sanitized.replace(/\s+role="[^"]*"/gi, ''); // Remove role attributes
  
  // Remove empty paragraphs and divs
  sanitized = sanitized.replace(/<p[^>]*>\s*<\/p>/gi, '');
  sanitized = sanitized.replace(/<div[^>]*>\s*<\/div>/gi, '');
  
  // Remove script and style tags completely
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove problematic tags that Calibre might not handle well
  sanitized = sanitized.replace(/<svg[\s\S]*?<\/svg>/gi, ''); // Remove SVG elements
  sanitized = sanitized.replace(/<canvas[\s\S]*?<\/canvas>/gi, ''); // Remove canvas elements
  sanitized = sanitized.replace(/<video[\s\S]*?<\/video>/gi, ''); // Remove video elements
  sanitized = sanitized.replace(/<audio[\s\S]*?<\/audio>/gi, ''); // Remove audio elements
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, ''); // Remove iframes
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, ''); // Remove object elements
  sanitized = sanitized.replace(/<embed[\s\S]*?<\/embed>/gi, ''); // Remove embed elements
  
  // Convert divs to paragraphs for better e-reader compatibility
  sanitized = sanitized.replace(/<div([^>]*)>/gi, '<p$1>');
  sanitized = sanitized.replace(/<\/div>/gi, '</p>');
  
  // Clean up excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' '); // Multiple spaces to single space
  sanitized = sanitized.replace(/>\s+</g, '><'); // Remove whitespace between tags
  
  // Ensure we have proper paragraph structure
  sanitized = sanitized.replace(/(<\/p>)\s*(<p[^>]*>)/gi, '$1\n$2');
  
  console.log(`HTML sanitized for Kindle, length: ${sanitized.length}`);
  return sanitized.trim();
}