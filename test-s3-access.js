#!/usr/bin/env node
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3EmailAccess() {
  console.log('🔧 Testing S3 Email Access');
  console.log('===========================\n');
  
  // Use the actual email object path from the screenshot
  // The key appears to be in the incoming/ folder
  const testKey = 'incoming/aq16bvjcmd3ksnuiqa9ojdo4bqukf69chg81i0o1'; // Example from what might be in S3
  
  console.log(`Attempting to read email from S3...`);
  console.log(`Bucket: ${process.env.AWS_S3_EMAIL_BUCKET}`);
  console.log(`Key pattern: incoming/<messageId>\n`);
  
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_EMAIL_BUCKET,
      Key: testKey,
    });
    
    const response = await s3Client.send(command);
    console.log('✅ Successfully accessed email object!');
    console.log(`Content-Type: ${response.ContentType}`);
    console.log(`Size: ${response.ContentLength} bytes`);
    
  } catch (error) {
    console.log('❌ Failed to access email object');
    console.log(`Error: ${error.message}\n`);
    
    if (error.name === 'AccessDenied') {
      console.log('🔐 Permission Issue Detected!');
      console.log('SES writes objects that your IAM user cannot read.');
      console.log('\nSolution: Add S3 bucket policy to allow your IAM user to read SES objects');
    }
  }
}

testS3EmailAccess();