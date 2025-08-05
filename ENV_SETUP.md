# Environment Setup Guide

This guide walks you through setting up all required environment variables for ReadFlow.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local` following the sections below.

## Required Environment Variables

### 🔧 App Configuration
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 🗄️ Database (Neon PostgreSQL)
```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```

**Setup Steps:**
1. Create a [Neon](https://neon.tech) account
2. Create a new project and database
3. Copy the connection string from your Neon dashboard
4. Replace `DATABASE_URL` with your connection string

### 🔐 Authentication (Better-Auth + Google OAuth)

```env
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com  
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup Steps:**
1. Generate a 32-character secret: `openssl rand -base64 32`
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create a new project or select existing
4. Enable Google+ API
5. Go to Credentials → Create OAuth 2.0 Client ID
6. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 📧 Email & SMTP (Kindle Delivery)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@readflow.com
MAILGUN_WEBHOOK_SIGNING_KEY=your-mailgun-webhook-signing-key
```

**Setup Steps:**
1. **Gmail SMTP**: Enable 2FA and create an App Password
2. **Mailgun**: 
   - Create [Mailgun](https://mailgun.com) account
   - Add your domain and verify DNS
   - Get webhook signing key from Settings → Webhooks
   - Set webhook URL: `https://yourdomain.com/api/email/receive`

### ☁️ File Storage (Cloudflare R2)

```env
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_UPLOAD_IMAGE_ACCESS_KEY_ID=your-r2-access-key-id  
R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_UPLOAD_IMAGE_BUCKET_NAME=readflow-images
```

**Setup Steps:**
1. Create [Cloudflare](https://cloudflare.com) account
2. Go to R2 Object Storage
3. Create a new bucket (e.g., `readflow-images`)
4. Go to Account → API Tokens → R2 Tokens
5. Create token with Object Read & Write permissions
6. Copy Account ID, Access Key ID, and Secret Access Key

### 💳 Payments & Subscriptions (Stripe)

```env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_starter_monthly_id
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro_monthly_id
```

**Setup Steps:**
1. Create [Stripe](https://stripe.com) account
2. Go to Developers → API keys and copy:
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Create subscription products and prices:
   - Go to Products → Add product
   - Set up recurring pricing (monthly/yearly)
   - Copy the price IDs (start with `price_`)
4. Set up webhooks:
   - Go to Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
   - Copy the webhook signing secret (starts with `whsec_`)
5. Enable Customer Portal:
   - Go to Settings → Billing → Customer portal
   - Configure portal settings and branding

### 🤖 AI Processing (Optional)

```env
# OPENAI_API_KEY=sk-your-openai-api-key  # Optional - only needed for AI features
# PERPLEXITY_API_KEY=pplx-your-perplexity-key  # Optional
```

**Setup Steps (Optional):**
1. Create [OpenAI](https://platform.openai.com) account
2. Generate API key from API Keys section
3. (Optional) Create [Perplexity](https://perplexity.ai) account for enhanced processing

**Note:** These are only needed if you plan to use AI-powered content processing features. The core ReadFlow functionality works without them.

## Validation

After setting up your environment variables, test the configuration:

```bash
# Run database migration
npm run db:push

# Start the development server  
npm run dev

# Run tests to verify setup
npm run test
```

## Production Deployment

For production deployment (Vercel/Netlify):

1. Set all environment variables in your hosting platform
2. Update URLs to production domains:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   BETTER_AUTH_URL=https://yourdomain.com
   ```
3. Update OAuth redirect URIs to production URLs
4. Configure webhook endpoints to production URLs

## Security Notes

- Never commit `.env.local` or `.env` files to version control
- Use strong, unique secrets for all keys
- Rotate secrets regularly in production
- Use different credentials for development/staging/production environments
- Enable 2FA on all service accounts

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format and credentials
- Check if database is running and accessible
- Ensure SSL mode is correctly configured

### Authentication Issues  
- Verify Google OAuth redirect URIs match exactly
- Check BETTER_AUTH_SECRET is 32+ characters
- Ensure domain matches in OAuth settings

### Email Delivery Issues
- Test SMTP credentials with a simple email client
- Verify Mailgun domain is verified and active
- Check webhook endpoints are publicly accessible

For more help, check the [troubleshooting docs](./docs/troubleshooting.md) or open an issue.