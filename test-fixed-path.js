#!/usr/bin/env node
// Test if the path fix resolves the S3 email fetching

console.log('🔧 Testing Fixed S3 Path');
console.log('=========================');

async function testFixedWebhook() {
  const webhookUrl = 'https://www.linktoreader.com/api/email/ses-webhook';
  
  // Use one of the actual email objects from the S3 bucket
  // From the screenshot, we can see there are real emails there
  const testPayload = {
    Type: "Notification",
    MessageId: "test-path-fix-" + Date.now(),
    Message: JSON.stringify({
      eventType: "inbound", 
      mail: {
        messageId: "0000014a-f4d4-4f89-b0d6-0b999c53ff30", // This looks like a real message ID from S3
        timestamp: new Date().toISOString(),
        source: "test@example.com",
        destination: ["jctiusanen@linktoreader.com"],
        commonHeaders: {
          from: ["test@example.com"],
          to: ["jctiusanen@linktoreader.com"],
          subject: "Test Path Fix",
          date: new Date().toISOString()
        }
      },
      receipt: {
        action: {
          type: "S3",
          bucketName: "ses-linktoreader-emails-s3-1",
          objectKey: "0000014a-f4d4-4f89-b0d6-0b999c53ff30"
        }
      }
    }),
    Timestamp: new Date().toISOString(),
    SignatureVersion: "1",
    Signature: "test-signature-fix",
    SigningCertURL: "https://sns.us-east-1.amazonaws.com/cert.pem"
  };
  
  console.log('Testing webhook with path fix...');
  console.log('Looking for email in: incoming/0000014a-f4d4-4f89-b0d6-0b999c53ff30');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success) {
      console.log('\n🎉 SUCCESS! The path fix worked!');
      console.log('✅ Webhook can now fetch emails from S3');
      console.log('✅ Email processing pipeline is working');
    } else if (response.status === 500 && result.error === "Failed to process email") {
      console.log('\n⚠️  Still having S3 access issues');
      console.log('This might be AWS credential propagation delay');
      console.log('Wait a few minutes and try again');
    } else if (response.status === 400) {
      console.log('\n📋 Different error - checking validation');
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

await testFixedWebhook();

console.log('\n💡 Next Steps:');
console.log('1. If still failing: Wait 5-10 minutes for AWS IAM propagation');
console.log('2. Send real test email to jctiusanen@linktoreader.com');  
console.log('3. Check Vercel function logs for detailed errors');