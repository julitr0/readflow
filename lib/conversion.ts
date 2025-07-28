import { JSDOM } from 'jsdom';
import { optimize } from 'svgo';
import sharp from 'sharp';

export interface ConversionMetadata {
  title: string;
  author: string;
  date: string;
  source: string;
  wordCount: number;
  readingTime: number;
}

export interface ConversionResult {
  success: boolean;
  fileUrl?: string;
  metadata?: ConversionMetadata;
  error?: string;
  fileSize?: number;
}

export interface ConversionOptions {
  optimizeImages?: boolean;
  maxImageWidth?: number;
  maxImageHeight?: number;
  imageQuality?: number;
  preserveFormatting?: boolean;
}

export class ContentConverter {
  private defaultOptions: ConversionOptions = {
    optimizeImages: true,
    maxImageWidth: 600,
    maxImageHeight: 800,
    imageQuality: 80,
    preserveFormatting: true,
  };

  /**
   * Convert HTML content to Kindle-compatible format
   */
  async convertHtmlToKindle(
    htmlContent: string,
    metadata: ConversionMetadata,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Parse HTML content
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Clean and optimize HTML
      const cleanedHtml = await this.cleanHtml(document, mergedOptions);
      
      // Process images
      const processedHtml = await this.processImages(cleanedHtml, mergedOptions);
      
      // Generate Kindle-compatible format
      const kindleContent = this.generateKindleFormat(processedHtml, metadata);
      
      // Calculate file size (simplified)
      const fileSize = Buffer.byteLength(kindleContent, 'utf8');
      
      return {
        success: true,
        fileUrl: `converted/${Date.now()}.html`, // In real implementation, save to storage
        metadata,
        fileSize,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
      };
    }
  }

  /**
   * Clean and optimize HTML content
   */
  private async cleanHtml(document: Document, options: ConversionOptions): Promise<string> {
    // Remove unwanted elements
    const elementsToRemove = [
      'script', 'style', 'iframe', 'object', 'embed',
      '.advertisement', '.ads', '.social-share', '.comments'
    ];
    
    elementsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Clean up formatting
    if (options.preserveFormatting) {
      this.preserveFormatting(document);
    }

    // Optimize for Kindle reading
    this.optimizeForKindle(document);

    return document.documentElement.outerHTML;
  }

  /**
   * Process and optimize images for Kindle
   */
  private async processImages(html: string, options: ConversionOptions): Promise<string> {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const images = document.querySelectorAll('img');

    for (const img of Array.from(images)) {
      const src = img.getAttribute('src');
      if (!src) continue;

      try {
        // Process image (in real implementation, download and optimize)
        const optimizedSrc = await this.optimizeImage(src, options);
        img.setAttribute('src', optimizedSrc);
        
        // Add Kindle-friendly attributes
        img.setAttribute('style', 'max-width: 100%; height: auto;');
        img.setAttribute('alt', img.getAttribute('alt') || 'Image');
      } catch (error) {
        console.warn(`Failed to process image: ${src}`, error);
        // Remove problematic images
        img.remove();
      }
    }

    return document.documentElement.outerHTML;
  }

  /**
   * Optimize image for Kindle display
   */
  private async optimizeImage(src: string, options: ConversionOptions): Promise<string> {
    // In real implementation, this would:
    // 1. Download the image
    // 2. Resize to Kindle-friendly dimensions
    // 3. Optimize quality and format
    // 4. Upload to storage
    // 5. Return the new URL

    // For now, return the original src
    return src;
  }

  /**
   * Preserve important formatting for Kindle
   */
  private preserveFormatting(document: Document): void {
    // Ensure headings are properly structured
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.setAttribute('style', 'margin: 1em 0; font-weight: bold;');
    });

    // Preserve paragraph spacing
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.setAttribute('style', 'margin: 0.5em 0; line-height: 1.6;');
    });

    // Preserve lists
    const lists = document.querySelectorAll('ul, ol');
    lists.forEach(list => {
      list.setAttribute('style', 'margin: 0.5em 0; padding-left: 1.5em;');
    });
  }

  /**
   * Optimize HTML specifically for Kindle reading
   */
  private optimizeForKindle(document: Document): void {
    // Add Kindle-specific CSS
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
        margin: 0;
        padding: 1em;
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: #000;
        margin: 1em 0 0.5em 0;
        page-break-after: avoid;
      }
      
      p {
        margin: 0.5em 0;
        text-align: justify;
      }
      
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        page-break-inside: avoid;
      }
      
      blockquote {
        margin: 1em 0;
        padding: 0.5em 1em;
        border-left: 3px solid #ccc;
        background: #f9f9f9;
      }
      
      code {
        background: #f4f4f4;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      
      pre {
        background: #f4f4f4;
        padding: 1em;
        overflow-x: auto;
        border-radius: 5px;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Generate Kindle-compatible format
   */
  private generateKindleFormat(html: string, metadata: ConversionMetadata): string {
    const kindleTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <meta name="author" content="${metadata.author}">
    <meta name="date" content="${metadata.date}">
    <meta name="source" content="${metadata.source}">
    <meta name="word-count" content="${metadata.wordCount}">
    <meta name="reading-time" content="${metadata.readingTime}">
</head>
<body>
    <article>
        <header>
            <h1>${metadata.title}</h1>
            <div class="metadata">
                <p><strong>Author:</strong> ${metadata.author}</p>
                <p><strong>Date:</strong> ${metadata.date}</p>
                <p><strong>Source:</strong> ${metadata.source}</p>
                <p><strong>Reading time:</strong> ${metadata.readingTime} minutes</p>
            </div>
        </header>
        
        <div class="content">
            ${html}
        </div>
        
        <footer>
            <p>Converted by ReadFlow - Distraction-free reading on Kindle</p>
        </footer>
    </article>
</body>
</html>`;

    return kindleTemplate;
  }

  /**
   * Extract metadata from HTML content
   */
  extractMetadata(htmlContent: string): ConversionMetadata {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract title
    const title = document.querySelector('title')?.textContent || 
                  document.querySelector('h1')?.textContent || 
                  'Untitled Article';
    
    // Extract author
    const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                   document.querySelector('.author')?.textContent ||
                   'Unknown Author';
    
    // Extract date
    const date = document.querySelector('meta[name="date"]')?.getAttribute('content') ||
                 document.querySelector('time')?.getAttribute('datetime') ||
                 new Date().toISOString();
    
    // Extract source (from URL or meta tag)
    const source = document.querySelector('meta[name="source"]')?.getAttribute('content') ||
                   'Unknown Source';
    
    // Calculate word count
    const textContent = document.body?.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      title: title.trim(),
      author: author.trim(),
      date: date.trim(),
      source: source.trim(),
      wordCount,
      readingTime,
    };
  }

  /**
   * Validate if content is suitable for conversion
   */
  validateContent(htmlContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!htmlContent || htmlContent.trim().length === 0) {
      errors.push('Content is empty');
    }
    
    if (htmlContent.length > 1000000) { // 1MB limit
      errors.push('Content is too large');
    }
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Check for minimum content
    const textContent = document.body?.textContent || '';
    if (textContent.trim().split(/\s+/).length < 10) {
      errors.push('Content is too short (minimum 10 words)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const contentConverter = new ContentConverter(); 