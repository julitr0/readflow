import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { conversion, userSettings } from "@/db/schema";
import { contentConverter } from "@/lib/conversion";
import { sendToKindle } from "@/lib/kindle-delivery";
import { usageTracker } from "@/lib/usage-tracker";
import { emailProcessingRateLimit } from "@/lib/rate-limiter";
import { validateSNSSignature } from "@/lib/validation";
import { sesS3Processor, type SESEmailData } from "@/lib/ses-s3-processor";
import { extractLinksFromEmail } from "@/lib/url-extractor";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn?: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
  UnsubscribeURL?: string;
  SubscribeURL?: string;
  Token?: string;
}

interface SESMailObject {
  timestamp: string;
  source: string;
  messageId: string;
  destination: string[];
  headersTruncated: boolean;
  headers: Array<{
    name: string;
    value: string;
  }>;
  commonHeaders: {
    from: string[];
    to: string[];
    subject: string;
    date: string;
  };
}

interface SESEvent {
  eventType: string;
  mail: SESMailObject;
  receipt?: {
    action: {
      type: string;
      bucketName: string;
      objectKey: string;
    };
    spamVerdict?: { status: string };
    virusVerdict?: { status: string };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the SNS message
    const body = await request.text();
    let snsMessage: SNSMessage;

    try {
      snsMessage = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse SNS message:", error);
      return NextResponse.json(
        { error: "Invalid SNS message format" },
        { status: 400 },
      );
    }

    // Validate SNS signature
    if (!(await validateSNSSignature(snsMessage))) {
      console.error("Invalid SNS signature");
      return NextResponse.json(
        { error: "Invalid SNS signature" },
        { status: 401 },
      );
    }

    // Handle subscription confirmation
    if (snsMessage.Type === "SubscriptionConfirmation") {
      console.log("SNS Subscription Confirmation received");

      // Automatically confirm the subscription
      if (snsMessage.SubscribeURL) {
        try {
          const response = await fetch(snsMessage.SubscribeURL);
          if (response.ok) {
            console.log("SNS subscription confirmed successfully");
            return NextResponse.json({
              success: true,
              message: "Subscription confirmed",
            });
          }
        } catch (error) {
          console.error("Failed to confirm SNS subscription:", error);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Subscription confirmation received",
        subscribeUrl: snsMessage.SubscribeURL,
      });
    }

    // Handle notification messages
    if (snsMessage.Type === "Notification") {
      // Parse the event from the SNS message
      let event: Record<string, unknown>;

      try {
        event = JSON.parse(snsMessage.Message);
      } catch (error) {
        console.error("Failed to parse event:", error);
        return NextResponse.json(
          { error: "Invalid event format" },
          { status: 400 },
        );
      }

      // Check if this is an S3 event notification
      const records = event.Records as Array<{
        s3?: {
          bucket: { name: string };
          object: { key: string };
        };
      }>;
      
      if (records && records[0]?.s3) {
        console.log("S3 event notification received");
        
        // Extract S3 location from S3 event
        const s3Record = records[0].s3;
        const s3Location = {
          bucket: s3Record.bucket.name,
          key: s3Record.object.key,
          region: process.env.AWS_REGION || "us-east-1",
        };
        
        console.log("S3 object location:", s3Location);
        
        // Fetch and process the email from S3
        const emailData = await sesS3Processor.fetchAndParseEmail(s3Location);
        
        if (!emailData) {
          console.error("Failed to fetch or parse email from S3");
          return NextResponse.json(
            { error: "Failed to process email" },
            { status: 500 },
          );
        }
        
        // Process the email
        const validation = sesS3Processor.validateEmailForProcessing(emailData);
        if (!validation.isValid) {
          console.log("Email validation failed:", validation.errors);
          await sesS3Processor.deleteEmail(s3Location);
          return NextResponse.json(
            { error: validation.errors.join(", ") },
            { status: 400 },
          );
        }
        
        const result = await processEmailData(emailData);
        await sesS3Processor.deleteEmail(s3Location);
        
        return NextResponse.json(result);
      }
      
      // Check if this is a SES event (legacy support)
      const sesEvent = event as unknown as SESEvent;
      if (sesEvent.eventType !== "inbound" && !sesEvent.mail) {
        console.log("Not an inbound email event, skipping");
        return NextResponse.json({
          success: true,
          message: "Event ignored",
        });
      }

      // Extract S3 location from the SES event
      const s3Location = sesS3Processor.extractS3LocationFromSESEvent(sesEvent);

      if (!s3Location) {
        console.error("Could not extract S3 location from SES event");
        return NextResponse.json(
          { error: "Invalid SES event structure" },
          { status: 400 },
        );
      }

      // Fetch and parse the email from S3
      const emailData = await sesS3Processor.fetchAndParseEmail(s3Location);

      if (!emailData) {
        console.error("Failed to fetch or parse email from S3");
        return NextResponse.json(
          { error: "Failed to process email" },
          { status: 500 },
        );
      }

      // Validate the email
      const validation = sesS3Processor.validateEmailForProcessing(emailData);
      if (!validation.isValid) {
        console.log("Email validation failed:", validation.errors);
        // Still delete the email to avoid storage
        await sesS3Processor.deleteEmail(s3Location);
        return NextResponse.json(
          { error: validation.errors.join(", ") },
          { status: 400 },
        );
      }

      // Process the email using our existing pipeline
      const result = await processEmailData(emailData);

      // RF-11: Delete email from S3 after processing
      await sesS3Processor.deleteEmail(s3Location);

      return NextResponse.json(result);
    }

    // Handle unsubscribe confirmation
    if (snsMessage.Type === "UnsubscribeConfirmation") {
      console.log("SNS Unsubscribe Confirmation received");
      return NextResponse.json({
        success: true,
        message: "Unsubscribe confirmation received",
      });
    }

    // Unknown message type
    return NextResponse.json(
      { error: "Unknown SNS message type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("SES webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Process email data through our existing conversion pipeline
 * This reuses the logic from the Mailgun webhook handler
 */
async function processEmailData(emailData: SESEmailData) {
  const recipient = emailData.to;
  const sender = emailData.from;
  const bodyHtml = emailData.htmlBody;

  // RF-16: Rate limiting for email processing
  const rateLimitResult = emailProcessingRateLimit.isAllowed(sender);
  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime);
    return {
      error: "Rate limit exceeded",
      message: `Too many conversion requests. Please wait until ${resetDate.toLocaleTimeString()} before sending another email.`,
      resetTime: rateLimitResult.resetTime,
    };
  }

  // Extract personal email from recipient
  const personalEmail = recipient.toLowerCase();

  // Find user by personal email
  const userSetting = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.personalEmail, personalEmail))
    .limit(1);

  if (userSetting.length === 0) {
    console.log("User not found for email:", personalEmail);
    return { error: "User not found" };
  }

  const user = userSetting[0];

  if (!user.kindleEmail) {
    console.log("Kindle email not configured for user:", user.userId);
    return { error: "Kindle email not configured" };
  }

  // Check usage limits
  const usageCheck = await usageTracker.canUserConvert(user.userId);
  if (!usageCheck.canConvert) {
    console.log("Usage limit exceeded for user:", user.userId);
    return {
      error: usageCheck.reason || "Usage limit exceeded",
    };
  }

  // Check if email contains newsletter links
  const extractedUrls = extractLinksFromEmail(bodyHtml);
  let processedContent = bodyHtml;
  let processedMetadata = contentConverter.extractMetadata(bodyHtml);
  let contentWasExtractedFromUrl = false;
  
  if (extractedUrls.length > 0) {
    console.log(`Found ${extractedUrls.length} newsletter URLs in email`);
    
    // Extract content from the first valid URL using the working UI logic
    for (const url of extractedUrls) {
      console.log(`Attempting to extract content from: ${url}`);
      const extractedContent = await extractContentFromURLWorking(url);
      
      if (extractedContent) {
        console.log("Successfully extracted content from URL using working logic");
        processedContent = extractedContent.html;
        processedMetadata = {
          ...contentConverter.extractMetadata(extractedContent.html),
          title: extractedContent.title || processedMetadata.title,
          author: extractedContent.author || processedMetadata.author,
          source: extractedContent.source || processedMetadata.source,
        };
        contentWasExtractedFromUrl = true;
        break; // Use content from first successful extraction
      }
    }
  }

  // Validate content - skip word count check if content was extracted from URL
  const contentValidation = contentWasExtractedFromUrl 
    ? { isValid: true, errors: [] } // Skip validation for URL-extracted content
    : contentConverter.validateContent(processedContent);
    
  if (!contentValidation.isValid) {
    console.log("Content validation failed:", contentValidation.errors);
    return { error: contentValidation.errors.join(", ") };
  }

  // Use the processed metadata
  const metadata = processedMetadata;

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

  // Track the conversion
  await usageTracker.trackConversion(user.userId, conversionId);
  await usageTracker.checkAndSendUsageAlerts(user.userId);

  // Process conversion asynchronously with the processed content
  processConversionAsync(
    conversionId,
    processedContent,
    metadata,
    user.kindleEmail,
  ).catch((error) => {
    console.error("Async conversion processing failed:", error);
  });

  return {
    success: true,
    conversionId,
    message: "Email received and processing started",
  };
}

/**
 * Process conversion asynchronously
 * Copied from the original Mailgun handler
 */
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
  }
}

/**
 * Extract content from URL using the same working logic as the UI
 * Copied exactly from /app/api/conversion/url/route.ts
 */
async function extractContentFromURLWorking(url: string): Promise<{
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
    const title = extractTitleWorking(html);
    const author = extractAuthorWorking(html);
    const source = extractSourceWorking(url);

    console.log('Extracted metadata:', { title, author, source });

    // Clean the HTML content
    const cleanedHtml = cleanSubstackHTMLWorking(html);
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

function extractTitleWorking(html: string): string {
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

function extractAuthorWorking(html: string): string {
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

function extractSourceWorking(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return "Web Article";
  }
}

function cleanSubstackHTMLWorking(html: string): string {
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
