import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { conversion, userSettings } from "@/db/schema";
import { contentConverter } from "@/lib/conversion";
import { sendToKindle } from "@/lib/kindle-delivery";
import { usageTracker } from "@/lib/usage-tracker";
import {
  validateEmailReceive,
  validateMailgunSignature,
} from "@/lib/validation";
import { emailProcessingRateLimit } from "@/lib/rate-limiter";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate request format and required fields
    const validation = await validateEmailReceive(request);
    if (validation instanceof NextResponse) {
      return validation; // Return validation error response
    }

    const { data: emailData } = validation;

    // Verify webhook signature
    const webhookSigningKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!webhookSigningKey) {
      return NextResponse.json(
        { error: "Webhook signing key not configured" },
        { status: 500 },
      );
    }

    if (
      !validateMailgunSignature(
        emailData.timestamp,
        emailData.token,
        emailData.signature,
        webhookSigningKey,
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const recipient = emailData.To;
    const sender = emailData.From;
    const bodyHtml = emailData["body-html"];

    // RF-16: Rate limiting for email processing to prevent abuse
    const rateLimitResult = emailProcessingRateLimit.isAllowed(sender);
    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many conversion requests. Please wait until ${resetDate.toLocaleTimeString()} before sending another email.`,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        },
      );
    }

    // Extract personal email from recipient (e.g., user123@linktoreader.com -> user123)
    const personalEmail = recipient.toLowerCase();

    // Find user by personal email
    const userSetting = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.personalEmail, personalEmail))
      .limit(1);

    if (userSetting.length === 0) {
      console.log("User not found for email:", personalEmail);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userSetting[0];

    if (!user.kindleEmail) {
      console.log("Kindle email not configured for user:", user.userId);
      return NextResponse.json(
        { error: "Kindle email not configured" },
        { status: 400 },
      );
    }

    // Check usage limits before processing
    const usageCheck = await usageTracker.canUserConvert(user.userId);
    if (!usageCheck.canConvert) {
      console.log("Usage limit exceeded for user:", user.userId);
      return NextResponse.json(
        {
          error: usageCheck.reason || "Usage limit exceeded",
        },
        { status: 429 },
      );
    }

    // Validate content
    const contentValidation = contentConverter.validateContent(bodyHtml);
    if (!contentValidation.isValid) {
      console.log("Content validation failed:", contentValidation.errors);
      return NextResponse.json(
        { error: contentValidation.errors.join(", ") },
        { status: 400 },
      );
    }

    // Extract metadata
    const metadata = contentConverter.extractMetadata(bodyHtml);

    // Create conversion record
    const conversionId = crypto.randomUUID();
    await db
      .insert(conversion)
      .values({
        id: conversionId,
        userId: user.userId,
        title: metadata.title,
        author: metadata.author,
        source: sender,
        sourceUrl: null,
        date: new Date(metadata.date),
        wordCount: metadata.wordCount,
        readingTime: metadata.readingTime,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Track the conversion and check for usage alerts
    await usageTracker.trackConversion(user.userId, conversionId);
    await usageTracker.checkAndSendUsageAlerts(user.userId);

    // Process conversion asynchronously
    await processConversionAsync(
      conversionId,
      bodyHtml,
      metadata,
      user.kindleEmail,
    );

    return NextResponse.json({
      success: true,
      conversionId,
      message: "Email received and processing started",
    });
  } catch (error) {
    console.error("Email processing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// verifyMailgunSignature function removed - using validation middleware instead

async function processConversionAsync(
  conversionId: string,
  htmlContent: string,
  metadata: import("@/lib/conversion").ConversionMetadata,
  kindleEmail: string,
) {
  try {
    // Convert content with retry logic
    let conversionResult;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        conversionResult = await contentConverter.convertHtmlToKindle(
          htmlContent,
          metadata as import("@/lib/conversion").ConversionMetadata,
        );

        if (conversionResult.success) {
          break;
        }
      } catch (error) {
        console.log(`Conversion attempt ${attempts} failed:`, error);

        if (attempts === maxAttempts) {
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempts) * 1000),
        );
      }
    }

    if (!conversionResult?.success) {
      throw new Error(
        conversionResult?.error || "Conversion failed after retries",
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

    // Send to Kindle with retry logic
    const deliveryResult = await sendToKindle(
      conversionResult.fileUrl!,
      kindleEmail,
      (metadata as import("@/lib/conversion").ConversionMetadata).title,
    );

    if (deliveryResult.success) {
      await db
        .update(conversion)
        .set({
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(conversion.id, conversionId));
    } else {
      throw new Error(deliveryResult.error || "Kindle delivery failed");
    }
  } catch (error) {
    console.error("Conversion processing failed:", error);

    // Update conversion record with error
    await db
      .update(conversion)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where(eq(conversion.id, conversionId));

    // TODO: Send failure notification email to user
  }
}
