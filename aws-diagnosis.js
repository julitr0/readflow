#!/usr/bin/env node
import { S3Client, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_EMAIL_BUCKET || 'ses-linktoreader-emails-s3-1';

console.log('🔍 AWS Email Pipeline Diagnosis');
console.log('================================');
console.log(`Region: ${region}`);
console.log(`Bucket: ${bucketName}`);
console.log('');

const awsConfig = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const s3Client = new S3Client(awsConfig);
const snsClient = new SNSClient(awsConfig);

async function checkCredentials() {
  console.log('1️⃣ Testing AWS Credentials...');
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('   ❌ AWS credentials not found in environment');
    return false;
  }
  
  console.log(`   ✅ Access Key ID: ${process.env.AWS_ACCESS_KEY_ID.slice(0, 8)}...`);
  console.log(`   ✅ Secret Key: ${'*'.repeat(20)}...`);
  return true;
}

async function checkS3Bucket() {
  console.log('\n2️⃣ Testing S3 Bucket Access...');
  
  try {
    // Test bucket access
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log('   ✅ S3 bucket exists and is accessible');
    
    // List objects in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10
    });
    
    const response = await s3Client.send(listCommand);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`   📧 Found ${response.Contents.length} emails in bucket:`);
      response.Contents.forEach(obj => {
        const date = obj.LastModified?.toLocaleDateString() || 'unknown';
        const size = obj.Size || 0;
        console.log(`      • ${obj.Key} (${size} bytes, ${date})`);
      });
    } else {
      console.log('   📭 No emails found in S3 bucket');
      console.log('      → This suggests SES is not saving emails to S3');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ S3 bucket error: ${error.message}`);
    if (error.name === 'NoSuchBucket') {
      console.log('      → Bucket does not exist');
    } else if (error.name === 'AccessDenied') {
      console.log('      → Access denied - check credentials and bucket permissions');
    } else if (error.message.includes('signature')) {
      console.log('      → AWS signature error - check credentials');
    }
    return false;
  }
}

async function checkSNSTopics() {
  console.log('\n3️⃣ Testing SNS Topics...');
  
  try {
    const response = await snsClient.send(new ListTopicsCommand({}));
    
    if (response.Topics && response.Topics.length > 0) {
      console.log(`   📢 Found ${response.Topics.length} SNS topics:`);
      
      const emailTopics = response.Topics.filter(topic => 
        topic.TopicArn?.includes('email') || 
        topic.TopicArn?.includes('ses') ||
        topic.TopicArn?.includes('linktoreader')
      );
      
      if (emailTopics.length > 0) {
        emailTopics.forEach(topic => {
          console.log(`      ✅ ${topic.TopicArn}`);
        });
      } else {
        console.log('      ⚠️ No email-related SNS topics found');
        response.Topics.forEach(topic => {
          console.log(`      • ${topic.TopicArn}`);
        });
      }
    } else {
      console.log('   📢 No SNS topics found');
      console.log('      → Need to create SNS topic for S3 notifications');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ SNS error: ${error.message}`);
    return false;
  }
}

async function checkSESManually() {
  console.log('\n4️⃣ SES Configuration (Manual Check Required)...');
  console.log('   ⚠️  SES configuration needs manual verification in AWS Console');
  console.log('   📋 Required SES Setup:');
  console.log('      1. Domain linktoreader.com must be verified');
  console.log('      2. Receipt rules must save @linktoreader.com emails to S3');
  console.log('      3. SES must have permission to write to S3 bucket');
  console.log('   → Will guide you through AWS Console steps');
  return false; // Always needs manual check
}

async function generateDiagnosisReport() {
  console.log('\n📊 DIAGNOSIS SUMMARY');
  console.log('====================');
  
  const credentialsOk = await checkCredentials();
  if (!credentialsOk) {
    console.log('🚨 CRITICAL: Fix AWS credentials first');
    return;
  }
  
  const s3Ok = await checkS3Bucket();
  const snsOk = await checkSNSTopics();  
  const sesOk = await checkSESManually();
  
  console.log('\n🔧 NEXT STEPS:');
  
  if (!s3Ok) {
    console.log('1. ❗ CRITICAL: Fix S3 bucket access permissions');
  }
  
  console.log('2. ❗ CRITICAL: Verify linktoreader.com domain in AWS SES');
  console.log('3. ❗ CRITICAL: Create SES receipt rules to save emails to S3');
  
  if (!snsOk) {
    console.log('4. ❗ Setup SNS topic and S3 notifications');
  }
  
  console.log('\n👆 I will guide you through each step in AWS Console!');
}

await generateDiagnosisReport();