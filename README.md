# ReadFlow

Transform newsletters into distraction-free reading on your Kindle. ReadFlow converts your favorite email newsletters and articles into Kindle-compatible format for seamless, distraction-free reading.

## ✨ Features

### 📧 Email Processing & Conversion
- **Personal Email Address**: Each user gets a unique ReadFlow email address
- **Newsletter Support**: Compatible with Substack, Medium, ConvertKit, and more
- **HTML to Kindle**: Automatic conversion to MOBI/AZW3 format
- **Metadata Preservation**: Maintains article title, author, and date
- **Image Optimization**: Processes and optimizes images for Kindle

### 📱 Kindle Integration
- **Direct Delivery**: Automatic delivery to your Kindle device
- **Multiple Devices**: Support for multiple Kindle devices per account
- **Delivery Tracking**: Real-time tracking of article delivery status
- **Retry Logic**: Automatic retry for failed deliveries

### 📊 User Experience
- **Usage Dashboard**: Track your article usage and subscription limits
- **Article Library**: Organized list of all converted articles
- **Reading Status**: Visual indicators for read/unread articles
- **Search & Filter**: Find articles by source, date, or status
- **Mobile Responsive**: Works seamlessly on all devices

### 💳 Subscription Management
- **Competitive Pricing**: $3/month for 100 articles vs competitors' $5/month for 50
- **Better Value**: 2x more articles per dollar
- **Usage Tracking**: Clear visibility of subscription limits
- **Easy Upgrades**: Seamless plan upgrades and billing management

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth v1.2.8 with Google OAuth
- **Payments**: Polar.sh integration
- **File Storage**: Cloudflare R2 for email attachments
- **Email Processing**: Custom email parsing and conversion service
- **Kindle Integration**: Email-to-Kindle delivery system

## 📁 Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── dashboard/           # Protected dashboard area
│   │   ├── _components/     # Dashboard components
│   │   ├── articles/        # Article management
│   │   ├── settings/        # User settings & Kindle config
│   │   └── billing/         # Subscription management
│   ├── api/
│   │   ├── email/           # Email processing endpoints
│   │   ├── conversions/     # Article conversion endpoints
│   │   └── user/            # User management endpoints
│   └── pricing/             # Public pricing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── email/               # Email processing components
│   ├── kindle/              # Kindle integration components
│   └── dashboard/           # Dashboard components
├── lib/
│   ├── auth/                # Authentication config
│   ├── email/               # Email processing utilities
│   ├── kindle/              # Kindle delivery utilities
│   └── conversion/          # HTML to Kindle conversion
└── db/
    ├── schema.ts            # Database schema
    └── drizzle.ts           # Database connection
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket for file storage
- Polar.sh account for subscriptions
- Email processing service (SendGrid, Mailgun, etc.)
- Kindle delivery service integration

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd readflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file with:
```env
# Database
DATABASE_URL="your-neon-database-url"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Polar.sh
POLAR_ACCESS_TOKEN="your-polar-access-token"
POLAR_WEBHOOK_SECRET="your-webhook-secret"

# Email Processing
EMAIL_SERVICE_API_KEY="your-email-service-api-key"
EMAIL_WEBHOOK_SECRET="your-email-webhook-secret"

# Kindle Integration
KINDLE_DELIVERY_API_KEY="your-kindle-delivery-api-key"

# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
R2_UPLOAD_IMAGE_ACCESS_KEY_ID="your-r2-access-key-id"
R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_UPLOAD_IMAGE_BUCKET_NAME="your-r2-bucket-name"

# ReadFlow Pricing Tiers
NEXT_PUBLIC_STARTER_TIER="your-starter-product-id"
NEXT_PUBLIC_PRO_TIER="your-pro-product-id"
```

4. **Database Setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit push
```

5. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🎯 Key Features Explained

### Email Processing
- **Webhook Endpoint**: Receives forwarded emails from users
- **HTML Parsing**: Extracts content and metadata from newsletters
- **Platform Support**: Handles various newsletter platforms
- **Error Handling**: Graceful handling of malformed emails

### Kindle Integration
- **Email-to-Kindle**: Sends converted files to user's Kindle
- **Delivery Tracking**: Monitors delivery status and retries
- **Device Management**: Supports multiple Kindle devices
- **Format Validation**: Ensures Kindle compatibility

### User Dashboard
- **Usage Statistics**: Clear display of monthly usage vs. limits
- **Article Management**: Comprehensive article library
- **Settings Management**: Kindle email and account configuration
- **Billing Portal**: Subscription and payment management

## 🔧 Customization

### Adding New Features
1. Create components in `components/`
2. Add API routes in `app/api/`
3. Update database schema in `db/schema.ts`
4. Run `npx drizzle-kit generate` and `npx drizzle-kit push`

### Email Processing
- Configure email service in `lib/email/`
- Add new newsletter platform support
- Customize conversion logic in `lib/conversion/`

### Kindle Integration
- Set up Kindle delivery service
- Configure device management
- Implement delivery tracking

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Polar.sh Documentation](https://docs.polar.sh)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm start
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for distraction-free reading on Kindle.
