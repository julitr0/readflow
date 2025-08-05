import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { conversion, user } from "@/db/schema";
import { contentConverter, type ConversionMetadata } from "@/lib/conversion";
import { validateConversionRequest, validateConversionFilters } from "@/lib/validation";
import { kindleDelivery } from "@/lib/kindle-delivery";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, or, ilike, desc, sql, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate request data
    const validation = await validateConversionRequest(request);
    if (validation instanceof NextResponse) {
      return validation; // Return validation error response
    }
    
    const { data } = validation;

    const userId = result.session.userId;

    const { url, htmlContent, sourceUrl, customMetadata, sendToKindle } = data;

    let finalHtmlContent: string;
    let finalSourceUrl: string | undefined;

    // Handle URL-based conversion
    if (url) {
      try {
        // Fetch content from URL
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'ReadFlow/1.0 (Article Converter)',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
        
        finalHtmlContent = await response.text();
        finalSourceUrl = url;
      } catch (error) {
        return NextResponse.json(
          { error: "Failed to fetch content from URL", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 400 }
        );
      }
    } else {
      // Use provided HTML content
      finalHtmlContent = htmlContent!;
      finalSourceUrl = sourceUrl;
    }

    // Validate content
    const contentValidation = contentConverter.validateContent(finalHtmlContent);
    if (!contentValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid content", details: contentValidation.errors },
        { status: 400 }
      );
    }

    // Extract metadata
    const extractedMetadata = contentConverter.extractMetadata(finalHtmlContent);
    const metadata: ConversionMetadata = {
      ...extractedMetadata,
      ...customMetadata,
      source: customMetadata?.source || extractedMetadata.source,
    };

    // Create conversion record
    const conversionId = nanoid();
    const conversionRecord = {
      id: conversionId,
      userId,
      title: metadata.title,
      author: metadata.author,
      source: metadata.source,
      sourceUrl: finalSourceUrl || null,
      date: new Date(metadata.date),
      wordCount: metadata.wordCount,
      readingTime: metadata.readingTime,
      status: "pending" as const,
      metadata: JSON.stringify(metadata),
    };

    // Insert into database
    await db.insert(conversion).values(conversionRecord);

    // Perform conversion
    const conversionResult = await contentConverter.convertHtmlToKindle(
      finalHtmlContent,
      metadata
    );

    if (!conversionResult.success) {
      // Update conversion record with error
      await db
        .update(conversion)
        .set({
          status: "failed",
          error: conversionResult.error,
          updatedAt: new Date(),
        })
        .where(eq(conversion.id, conversionId));

      return NextResponse.json(
        { error: "Conversion failed", details: conversionResult.error },
        { status: 500 }
      );
    }

    // Update conversion record with success
    await db
      .update(conversion)
      .set({
        status: "completed",
        fileUrl: conversionResult.fileUrl,
        fileSize: conversionResult.fileSize,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversion.id, conversionId));

    // Send to Kindle if requested
    let deliveryResult;
    if (sendToKindle) {
      // Get user's Kindle email
      const userRecord = await db
        .select({ kindleEmail: user.kindleEmail })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord[0]?.kindleEmail) {
        return NextResponse.json({
          success: true,
          conversionId,
          metadata: conversionResult.metadata,
          fileUrl: conversionResult.fileUrl,
          fileSize: conversionResult.fileSize,
          warning: "Conversion successful, but no Kindle email configured. Please set your Kindle email in settings to receive files automatically.",
        });
      }

      // Send to Kindle
      deliveryResult = await kindleDelivery.sendToKindle(
        conversionResult.fileUrl!,
        userRecord[0].kindleEmail,
        metadata.title
      );

      if (!deliveryResult.success) {
        console.error("Kindle delivery failed:", deliveryResult.error);
        // Don't fail the entire request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      conversionId,
      metadata: conversionResult.metadata,
      fileUrl: conversionResult.fileUrl,
      fileSize: conversionResult.fileSize,
      delivered: sendToKindle ? deliveryResult?.success : false,
      deliveryError: deliveryResult?.success === false ? deliveryResult.error : undefined,
    });

  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = result.session.userId;

    // Validate query parameters
    const validation = await validateConversionFilters(request);
    if (validation instanceof NextResponse) {
      return validation; // Return validation error response
    }
    
    const { data: queryParams } = validation;
    const { page, limit, status, search } = queryParams;

    // Build where conditions
    const whereConditions = [eq(conversion.userId, userId)];
    
    if (status) {
      whereConditions.push(eq(conversion.status, status));
    }
    
    if (search) {
      const searchCondition = or(
        ilike(conversion.title, `%${search}%`),
        ilike(conversion.author, `%${search}%`),
        ilike(conversion.source, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Build query with pagination
    const offset = (page - 1) * limit;
    const query = db
      .select()
      .from(conversion)
      .where(and(...whereConditions))
      .orderBy(desc(conversion.createdAt))
      .limit(limit)
      .offset(offset);

    const conversions = await query;

    // Get total count for pagination using same conditions
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(conversion)
      .where(and(...whereConditions));

    const [{ count }] = await countQuery;

    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error("Get conversions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 