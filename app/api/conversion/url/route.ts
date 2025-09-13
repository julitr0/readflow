import { NextRequest, NextResponse } from "next/server";
import { contentConverter, type ConversionMetadata } from "@/lib/conversion";
import { epubGenerator } from "@/lib/epub-generator";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { url } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate Substack URL
    if (!url.includes('substack.com')) {
      return NextResponse.json(
        { error: "Currently only supports Substack URLs" },
        { status: 400 }
      );
    }

    console.log('Extracting content from URL:', url);

    // Extract content from URL
    const extractedContent = await extractContentFromURL(url);
    
    if (!extractedContent) {
      return NextResponse.json(
        { error: "Failed to extract content from URL" },
        { status: 400 }
      );
    }

    // Validate content
    const validation = contentConverter.validateContent(extractedContent.html);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid content extracted", details: validation.errors },
        { status: 400 }
      );
    }

    // Extract metadata
    const extractedMetadata = contentConverter.extractMetadata(extractedContent.html);
    const metadata: ConversionMetadata = {
      ...extractedMetadata,
      title: extractedContent.title || extractedMetadata.title,
      author: extractedContent.author || extractedMetadata.author,
      source: extractedContent.source || extractedMetadata.source,
    };

    console.log('Extracted metadata:', metadata);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Perform conversion
    const conversionResult = await contentConverter.convertHtmlToKindle(
      extractedContent.html,
      metadata
    );

    if (!conversionResult.success) {
      return NextResponse.json(
        { error: "Conversion failed", details: conversionResult.error },
        { status: 500 }
      );
    }

    // Generate EPUB file
    const epubFile = await epubGenerator.generateEpubFile(
      extractedContent.html,
      metadata,
      {
        title: metadata.title,
        author: metadata.author,
        publisher: "Link to Reader",
        language: "en",
      }
    );

    // Generate a mock conversion ID
    const conversionId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the file content directly
    const fileContent = epubFile.buffer;
    
    return NextResponse.json({
      success: true,
      conversionId,
      metadata: conversionResult.metadata,
      fileUrl: `/api/conversion/download/${conversionId}`,
      fileSize: epubFile.size,
      filename: epubFile.filename,
      fileContent: fileContent.toString('base64'), // Send file content as base64
      message: "URL extraction and conversion completed successfully!",
    });

  } catch (error) {
    console.error("URL conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function extractContentFromURL(url: string): Promise<{
  html: string;
  title: string;
  author: string;
  source: string;
} | null> {
  try {
    console.log('Fetching URL:', url);
    
    // For now, we'll use a simple fetch approach
    // In production, you might want to use a more robust solution like Puppeteer
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
    
    // Extract basic metadata from HTML
    const title = extractTitle(html);
    const author = extractAuthor(html);
    const source = extractSource(url);

    console.log('Extracted metadata:', { title, author, source });

    // Clean the HTML content
    const cleanedHtml = cleanSubstackHTML(html);
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
  const substackAuthorMatch = html.match(/<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i);
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
    return "Substack";
  }
}

function cleanSubstackHTML(html: string): string {
  // Remove scripts, styles, and other non-content elements
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

  // Try to extract the main content area
  // Look for common Substack content selectors
  const contentSelectors = [
    '[data-testid="post-content"]',
    '.post-content',
    '.entry-content',
    'article',
    '.content',
    'main',
    '.post-body',
    '.article-content',
    '.story-content'
  ];

  let contentFound = false;
  for (const selector of contentSelectors) {
    // Try different patterns for each selector
    const patterns = [
      new RegExp(`<[^>]*class="[^"]*${selector.replace('.', '').replace('[', '').replace(']', '')}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]*>`, 'i'),
      new RegExp(`<[^>]*data-testid="${selector.replace('[data-testid="', '').replace('"]', '')}"[^>]*>([\\s\\S]*?)<\\/[^>]*>`, 'i'),
      new RegExp(`<${selector.replace('.', '').replace('[', '').replace(']', '')}[^>]*>([\\s\\S]*?)<\\/${selector.replace('.', '').replace('[', '').replace(']', '')}>`, 'i')
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[1].length > 200) {
        cleaned = match[1];
        contentFound = true;
        console.log('Found content with selector:', selector);
        break;
      }
    }
    if (contentFound) break;
  }

  // If no specific content area found, try to extract body content
  if (!contentFound) {
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      cleaned = bodyMatch[1];
      console.log('Using body content as fallback');
    }
  }

  // Clean up the HTML
  cleaned = cleaned
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '')
    .replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '')
    .replace(/<div[^>]*class="[^"]*subscribe[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*paywall[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Remove empty elements and excessive whitespace
  cleaned = cleaned
    .replace(/<[^>]*>\s*<\/[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If we still don't have meaningful content, return a basic structure
  if (cleaned.length < 100) {
    console.log('Content too short, returning fallback');
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Extracted Article</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>Article Content</h1>
    <p>The content could not be fully extracted from the URL. Please try with a different article or use the direct HTML input method.</p>
    <p>This might be because:</p>
    <ul>
        <li>The article is behind a paywall</li>
        <li>The URL is not accessible</li>
        <li>The content structure is not supported</li>
    </ul>
</body>
</html>`;
  }

  console.log('Content extracted successfully, length:', cleaned.length);
  
  // Wrap in proper HTML structure
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Extracted Article</title>
    <meta charset="UTF-8">
</head>
<body>
    ${cleaned}
</body>
</html>`;
} 