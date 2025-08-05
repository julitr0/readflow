import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto", // required for R2
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_UPLOAD_IMAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY!,
  },
});

// File type validation for images
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]);

export const validateImageBuffer = (buffer: Buffer): { isValid: boolean; mimeType?: string } => {
  // Check file signatures (magic numbers)
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
  };

  for (const [mimeType, signature] of Object.entries(signatures)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      return { isValid: allowedMimeTypes.has(mimeType), mimeType };
    }
  }

  // For SVG, check for XML declaration or <svg tag
  const textContent = buffer.slice(0, 1024).toString('utf-8');
  if (textContent.includes('<svg') || textContent.includes('<?xml')) {
    return { isValid: true, mimeType: 'image/svg+xml' };
  }

  return { isValid: false };
};

export const uploadImageAssets = async (buffer: Buffer, key: string) => {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_UPLOAD_IMAGE_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: "image/*",
      ACL: "public-read", // optional if bucket is public
    })
  );

  const publicUrl = `https://pub-6f0cf05705c7412b93a792350f3b3aa5.r2.dev/${key}`;
  return publicUrl;
};
