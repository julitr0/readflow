import { ConversionMetadata } from "./conversion";
import { SYSTEM_FONT_STACK, MONOSPACE_FONT_STACK } from "./constants";

export interface MobiFileOptions {
  title: string;
  author: string;
  publisher?: string;
  language?: string;
  description?: string;
  coverImage?: string;
}

export class MobiGenerator {
  /**
   * Generate an EPUB file from HTML content (Kindle-compatible)
   * For demo purposes, we'll create a simple HTML file that can be converted to EPUB
   * In production, you'd use a proper EPUB generation library
   */
  async generateMobiFile(
    htmlContent: string,
    metadata: ConversionMetadata,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: MobiFileOptions = {
      title: metadata.title,
      author: metadata.author,
    },
  ): Promise<{ buffer: Buffer; filename: string; size: number }> {
    try {
      // Create enhanced HTML with proper e-book structure
      const epubHtml = this.createEpubHtml(htmlContent, metadata);

      // For demo purposes, create an HTML file that can be converted to EPUB
      // In production, you'd use a proper EPUB generation library like Calibre's CLI
      const htmlBuffer = Buffer.from(epubHtml, "utf8");

      // Create a filename
      const safeTitle = metadata.title
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 50);
      const filename = `${safeTitle}_${Date.now()}.html`;

      return {
        buffer: htmlBuffer,
        filename,
        size: htmlBuffer.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate EPUB file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create EPUB-compatible HTML structure
   */
  private createEpubHtml(
    htmlContent: string,
    metadata: ConversionMetadata,
  ): string {
    const epubTemplate = `<!DOCTYPE html>
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
    <style>
        /* MOBI-optimized styles */
        body {
            font-family: ${SYSTEM_FONT_STACK};
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 1em;
            font-size: 16px;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin: 1em 0 0.5em 0;
            page-break-after: avoid;
            font-weight: bold;
        }
        
        h1 { font-size: 1.8em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.3em; }
        
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
            font-style: italic;
        }
        
        code {
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: ${MONOSPACE_FONT_STACK};
            font-size: 0.9em;
        }
        
        pre {
            background: #f4f4f4;
            padding: 1em;
            overflow-x: auto;
            border-radius: 5px;
            font-family: ${MONOSPACE_FONT_STACK};
            font-size: 0.9em;
        }
        
        ul, ol {
            margin: 0.5em 0;
            padding-left: 1.5em;
        }
        
        li {
            margin: 0.3em 0;
        }
        
        .metadata {
            background: #f8f9fa;
            padding: 1em;
            border-radius: 5px;
            margin-bottom: 2em;
            border-left: 4px solid #007bff;
        }
        
        .metadata p {
            margin: 0.3em 0;
            font-size: 0.9em;
        }
        
        .content {
            margin-top: 2em;
        }
        
        .footer {
            margin-top: 3em;
            padding-top: 1em;
            border-top: 1px solid #eee;
            font-size: 0.8em;
            color: #666;
            text-align: center;
        }
    </style>
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
                <p><strong>Word count:</strong> ${metadata.wordCount.toLocaleString()}</p>
            </div>
        </header>
        
        <div class="content">
            ${htmlContent}
        </div>
        
        <footer class="footer">
            <p>Converted by Link to Reader - Distraction-free reading on Kindle</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </footer>
    </article>
</body>
</html>`;

    return epubTemplate;
  }

  /**
   * Validate if the content is suitable for EPUB conversion
   */
  validateForEpub(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push("Content is empty");
    }

    if (content.length > 5000000) {
      // 5MB limit for EPUB
      errors.push("Content is too large for EPUB conversion");
    }

    // Check for minimum content
    const textContent = content.replace(/<[^>]*>/g, "").trim();
    if (textContent.length < 100) {
      errors.push("Content is too short for meaningful EPUB conversion");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const mobiGenerator = new MobiGenerator();
