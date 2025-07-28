import { NextRequest, NextResponse } from "next/server";
import { contentConverter, type ConversionMetadata } from "@/lib/conversion";
import { epubGenerator } from "@/lib/epub-generator";
import { storeTestConversion } from "@/lib/test-storage";

console.log('EPUB Generator imported:', !!epubGenerator);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { htmlContent, sourceUrl, customMetadata } = body;

    // Validate required fields
    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Validate content
    const validation = contentConverter.validateContent(htmlContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid content", details: validation.errors },
        { status: 400 }
      );
    }

    // Extract metadata
    const extractedMetadata = contentConverter.extractMetadata(htmlContent);
    const metadata: ConversionMetadata = {
      ...extractedMetadata,
      ...customMetadata,
      source: customMetadata?.source || extractedMetadata.source,
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Perform conversion
    const conversionResult = await contentConverter.convertHtmlToKindle(
      htmlContent,
      metadata
    );

    if (!conversionResult.success) {
      return NextResponse.json(
        { error: "Conversion failed", details: conversionResult.error },
        { status: 500 }
      );
    }

    console.log('Starting EPUB generation...');
    // Generate EPUB file
    const epubFile = await epubGenerator.generateEpubFile(
      htmlContent,
      metadata,
      {
        title: metadata.title,
        author: metadata.author,
        publisher: "ReadFlow",
        language: "en",
        description: `Converted article from ${metadata.source}`,
      }
    );
    console.log('EPUB generation result:', {
      filename: epubFile.filename,
      size: epubFile.size,
      isEpub: epubFile.filename.endsWith('.epub')
    });

    // Generate a mock conversion ID
    const conversionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the conversion data for download
    storeTestConversion(conversionId, {
      htmlContent,
      metadata,
      filename: epubFile.filename,
    });

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
      message: "Test conversion completed successfully!",
    });

  } catch (error) {
    console.error("Test conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 