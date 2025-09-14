#!/usr/bin/env node
console.log('🔍 Email Pipeline Status Check');
console.log('================================\n');

// Test 1: Check if webhook received any notifications
async function checkWebhookCalls() {
  console.log('1️⃣ Checking if webhook is being called by SNS...');
  
  // The email reached S3, so if S3→SNS is configured, webhook should have been called
  console.log('   → Check Vercel logs for recent webhook invocations');
  console.log('   → If no calls, S3 event notifications might not be working');
}

// Test 2: Check S3 object permissions
async function checkS3Permissions() {
  console.log('\n2️⃣ S3 Object Permission Analysis...');
  console.log('   The "Access Denied" error suggests:');
  console.log('   • SES writes objects with restrictive permissions');
  console.log('   • IAM user may need additional S3 permissions');
  console.log('   • Possible need for S3 bucket policy adjustment');
}

// Test 3: Current pipeline status
async function pipelineStatus() {
  console.log('\n3️⃣ Current Pipeline Status:');
  console.log('   ✅ Email → SES (working)');
  console.log('   ✅ SES → S3 (working - email saved)');
  console.log('   ❓ S3 → SNS (need to verify)');
  console.log('   ❓ SNS → Webhook (need to verify)');  
  console.log('   ❓ Webhook → S3 Fetch (likely failing due to permissions)');
  console.log('   ❌ Process → Kindle (blocked by upstream issues)');
}

checkWebhookCalls();
checkS3Permissions();
pipelineStatus();

console.log('\n📋 Next Steps:');
console.log('1. Check Vercel function logs for webhook calls');
console.log('2. If webhook IS being called → Fix S3 read permissions');
console.log('3. If webhook NOT being called → Fix S3 event notifications');