import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { conversion } from "@/db/schema";
import { contentConverter, type ConversionMetadata } from "@/lib/conversion";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, or, ilike, desc, sql } from "drizzle-orm";

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

    const userId = result.session.userId;

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

    // Create conversion record
    const conversionId = nanoid();
    const conversionRecord = {
      id: conversionId,
      userId,
      title: metadata.title,
      author: metadata.author,
      source: metadata.source,
      sourceUrl: sourceUrl || null,
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
      htmlContent,
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

    return NextResponse.json({
      success: true,
      conversionId,
      metadata: conversionResult.metadata,
      fileUrl: conversionResult.fileUrl,
      fileSize: conversionResult.fileSize,
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    let query = db
      .select()
      .from(conversion)
      .where(eq(conversion.userId, userId))
      .orderBy(desc(conversion.createdAt));

    // Apply filters
    if (status) {
      query = query.where(eq(conversion.status, status));
    }

    if (search) {
      query = query.where(
        or(
          ilike(conversion.title, `%${search}%`),
          ilike(conversion.author, `%${search}%`),
          ilike(conversion.source, `%${search}%`)
        )
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const conversions = await query;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(conversion)
      .where(eq(conversion.userId, userId));

    if (status) {
      countQuery.where(eq(conversion.status, status));
    }

    if (search) {
      countQuery.where(
        or(
          ilike(conversion.title, `%${search}%`),
          ilike(conversion.author, `%${search}%`),
          ilike(conversion.source, `%${search}%`)
        )
      );
    }

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