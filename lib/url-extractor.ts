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
  // Extract the main article content from Substack HTML
  const articleMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (articleMatch) {
    return articleMatch[1];
  }

  // Fallback: try to extract content between article tags
  const articleTagMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleTagMatch) {
    return articleTagMatch[1];
  }

  // Last resort: extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }

  return html;
}

function cleanMediumHTML(html: string): string {
  // Extract the main article content from Medium HTML
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return articleMatch[1];
  }

  // Try to find main content area
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return mainMatch[1];
  }

  return html;
}

function cleanGenericHTML(html: string): string {
  // Generic HTML cleaning
  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Try to extract main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return articleMatch[1];
  }

  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return mainMatch[1];
  }

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }

  return cleaned;
}