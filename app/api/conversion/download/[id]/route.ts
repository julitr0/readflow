import { NextRequest, NextResponse } from "next/server";
import { epubGenerator } from "@/lib/epub-generator";
import { getTestConversion } from "@/lib/test-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversionId } = await params;
    
    // Get the conversion data from shared storage
    const conversion = getTestConversion(conversionId);
    
    if (!conversion) {
      return NextResponse.json(
        { error: "Conversion not found" },
        { status: 404 }
      );
    }

    // Generate the EPUB file
    const epubFile = await epubGenerator.generateEpubFile(
      conversion.htmlContent,
      conversion.metadata,
      {
        title: conversion.metadata.title,
        author: conversion.metadata.author,
        publisher: "Link to Reader",
        language: "en",
        description: `Converted article from ${conversion.metadata.source}`,
      }
    );

    // Create response with file download headers
    const response = new NextResponse(epubFile.buffer);
    
    // Set headers for file download
    const contentType = epubFile.filename.endsWith('.epub') ? 'application/epub+zip' : 'text/html';
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${epubFile.filename}"`);
    response.headers.set('Content-Length', epubFile.size.toString());
    
    return response;

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

// Helper function to store conversion data (for demo purposes)
// This function is kept for compatibility but uses the shared storage
// In a real app, you'd store in a database
function storeConversion(): void {
  // Implementation placeholder
}

// Prevent unused function warning
void storeConversion; 