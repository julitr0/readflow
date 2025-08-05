import { ConversionMetadata } from "./conversion";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export interface EpubOptions {
  title: string;
  author: string;
  publisher?: string;
  language?: string;
  description?: string;
  coverImage?: string;
}

export class EpubGenerator {
  /**
   * Generate an EPUB file using Calibre's ebook-convert CLI
   * This is the most reliable method for creating Kindle-compatible EPUB files
   */
  async generateEpubFile(
    htmlContent: string,
    metadata: ConversionMetadata,
    options: EpubOptions = { title: metadata.title, author: metadata.author }
  ): Promise<{ buffer: Buffer; filename: string; size: number }> {
    try {
      console.log('Starting EPUB generation process...');
      
      // Create a temporary HTML file
      const tempDir = os.tmpdir();
      const tempHtmlPath = path.join(tempDir, `temp_${Date.now()}.html`);
      const tempEpubPath = path.join(tempDir, `temp_${Date.now()}.epub`);
      
      console.log('Temp files:', { tempHtmlPath, tempEpubPath });
      
      // Create enhanced HTML with proper e-book structure
      const epubHtml = this.createEpubHtml(htmlContent, metadata);
      
      // Write HTML to temporary file
      await fs.promises.writeFile(tempHtmlPath, epubHtml, 'utf8');
      console.log('HTML file written to temp location');
      
      // Check if Calibre is installed
      console.log('Checking Calibre installation...');
      const calibreInstalled = await this.checkCalibreInstallation();
      console.log('Calibre installed:', calibreInstalled);
      
      if (calibreInstalled) {
        console.log('Using Calibre for EPUB generation');
        // Use Calibre to convert HTML to EPUB
        await this.convertWithCalibre(tempHtmlPath, tempEpubPath, metadata, options);
        console.log('Calibre conversion completed');
        
        // Read the generated EPUB file
        const epubBuffer = await fs.promises.readFile(tempEpubPath);
        console.log('EPUB file read, size:', epubBuffer.length);
        
        // Clean up temporary files
        await this.cleanupTempFiles([tempHtmlPath, tempEpubPath]);
        
        // Create filename
        const safeTitle = metadata.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const filename = `${safeTitle}_${Date.now()}.epub`;
        
        console.log('EPUB generated successfully:', filename);
        return {
          buffer: epubBuffer,
          filename,
          size: epubBuffer.length,
        };
      } else {
        // Fallback to HTML if Calibre is not installed
        console.warn("Calibre not found, falling back to HTML generation");
        return this.generateFallbackHtml(epubHtml, metadata);
      }
    } catch (error) {
      console.error("EPUB generation error:", error);
      // Fallback to HTML generation
      const epubHtml = this.createEpubHtml(htmlContent, metadata);
      return this.generateFallbackHtml(epubHtml, metadata);
    }
  }

  /**
   * Check if Calibre is installed on the system
   */
  private async checkCalibreInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ebook-convert --version');
      console.log('Calibre found:', stdout.trim());
      return true;
    } catch (error) {
      console.log('Calibre not found:', error);
      return false;
    }
  }

  /**
   * Convert HTML to EPUB using Calibre's ebook-convert
   */
  private async convertWithCalibre(
    inputPath: string,
    outputPath: string,
    metadata: ConversionMetadata,
    options: EpubOptions
  ): Promise<void> {
    const calibreArgs = [
      `"${inputPath}"`,
      `"${outputPath}"`,
      `--title="${metadata.title}"`,
      `--authors="${metadata.author}"`,
      `--language="${options.language || 'en'}"`,
      `--publisher="${options.publisher || 'ReadFlow'}"`,
      '--no-chapters-in-toc',
      '--no-default-epub-cover',
      '--preserve-cover-aspect-ratio',
      '--disable-font-rescaling',
      '--input-encoding=utf-8',
    ];

    const command = `ebook-convert ${calibreArgs.join(' ')}`;
    console.log('Calibre command:', command);
    
    try {
      console.log('Executing Calibre conversion...');
      const { stdout, stderr } = await execAsync(command);
      console.log('Calibre stdout:', stdout);
      console.log('Calibre stderr:', stderr);
      
      if (stderr && !stderr.includes('Conversion successful')) {
        throw new Error(`Calibre conversion failed: ${stderr}`);
      }
      console.log('Calibre conversion successful');
    } catch (error) {
      console.error('Calibre conversion error:', error);
      throw new Error(`Calibre conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create EPUB-compatible HTML structure
   */
  private createEpubHtml(htmlContent: string, metadata: ConversionMetadata): string {
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
        /* EPUB-optimized styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #f4f4f4;
            padding: 1em;
            overflow-x: auto;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
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
                <p><strong>Word count:</strong> ${metadata.wordCount}</p>
            </div>
        </header>
        
        <div class="content">
            ${htmlContent}
        </div>
        
        <footer class="footer">
            <p>Converted by ReadFlow - Distraction-free reading on Kindle</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </footer>
    </article>
</body>
</html>`;

    return epubTemplate;
  }

  /**
   * Generate fallback HTML file if Calibre is not available
   */
  private generateFallbackHtml(htmlContent: string, metadata: ConversionMetadata): { buffer: Buffer; filename: string; size: number } {
    const htmlBuffer = Buffer.from(htmlContent, 'utf8');
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${safeTitle}_${Date.now()}.html`;
    
    return {
      buffer: htmlBuffer,
      filename,
      size: htmlBuffer.length,
    };
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete temporary file ${filePath}:`, error);
      }
    }
  }
}

export const epubGenerator = new EpubGenerator(); 