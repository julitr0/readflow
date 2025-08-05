import { uploadImageAssets, validateImageBuffer } from "@/lib/upload-image";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger, getCorrelationId } from "@/lib/logger";

export const config = {
  api: { bodyParser: false }, // Disable default body parsing
};

export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const context = logger.createContext('upload-image', undefined, { correlationId });
  
  try {
    logger.info('Image upload request received', context);
    
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      logger.warn('Unauthorized upload attempt', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    context.userId = result.session.userId;
    logger.info('User authenticated for upload', context);

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type - only allow image files
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files are allowed." },
        { status: 400 },
      );
    }

    // Validate file size - limit to 10MB
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: "File too large. Maximum size allowed is 10MB." },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content (magic number check)
    const validation = validateImageBuffer(buffer);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid file content. File appears to be corrupted or not a valid image." },
        { status: 400 }
      );
    }

    // Generate a unique filename with original extension
    const fileExt = file.name.split(".").pop() || "";
    const timestamp = Date.now();
    const filename = `upload-${timestamp}.${fileExt || "png"}`;

    // Upload the file
    logger.info('Uploading file to storage', { ...context, metadata: { filename, fileSize: buffer.length } });
    const url = await uploadImageAssets(buffer, filename);
    
    logger.info('File upload completed successfully', { ...context, metadata: { url, filename } });
    return NextResponse.json({ url });
  } catch (error) {
    logger.error("Upload processing failed", context, error as Error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 },
    );
  }
}
