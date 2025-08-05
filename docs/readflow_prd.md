# ReadFlow - Product Requirements Document (PRD)

## Executive Summary

**Product Name**: ReadFlow  
**Tagline**: "Transform newsletters into distraction-free reading on your Kindle"  
**Competitive Advantage**: Lower pricing with better value proposition  
**Target Market**: Newsletter subscribers, content creators, professionals who prefer Kindle reading

## 1. Product Vision

### Mission Statement
ReadFlow enables users to convert newsletters, articles, and email content into Kindle-compatible formats for distraction-free reading, offering better pricing than competitors while maintaining high-quality conversion.

### Value Proposition
- **Lower Cost**: More articles per dollar than competitors
- **Better Value**: $3/month for 100 articles vs $5/month for 50 articles
- **Seamless Experience**: Simple email sharing to Kindle delivery
- **High Quality**: Clean, readable formatting optimized for Kindle

### Competitive Analysis
| Feature | ReadBetter.io | ReadFlow |
|---------|---------------|----------|
| Starter Plan | $5/month (50 articles) | $3/month (100 articles) |
| Pro Plan | $10/month (200 articles) | $7/month (300 articles) |
| Conversion Quality | High | High |
| Kindle Integration | Yes | Yes |
| Email Forwarding | Yes | Yes |

## 2. Product Overview

### Core Functionality
1. **Email Processing**: Users receive a unique email address to forward newsletters
2. **Content Conversion**: HTML emails converted to EPUB format for Kindle
3. **Kindle Delivery**: Automatic delivery to user's Kindle device
4. **Usage Tracking**: Monitor article count and subscription status
5. **User Dashboard**: Manage settings, view history, track usage

### User Journey
1. **Sign Up**: Create account, choose subscription tier
2. **Setup**: Receive unique email address, configure Kindle email
3. **Share**: Use native email sharing from newsletters/websites to send articles to ReadFlow email
4. **Automatic Processing**: ReadFlow converts shared articles to EPUB format using Calibre
5. **Kindle Delivery**: Converted EPUB automatically sent to user's Kindle
6. **Manage**: Monitor usage, adjust settings via mobile-responsive dashboard

## 3. Technical Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router (based on [Next.js SaaS Starter Kit](https://github.com/michaelshimeles/nextjs-starter-kit))
- **Backend**: Next.js API routes
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth v1.2.8 with Google OAuth
- **Payments**: Polar.sh integration
- **File Storage**: Cloudflare R2 for email attachments and converted files
- **Email Processing**: Mailgun Inbound Email webhooks
- **Content Conversion**: Calibre CLI in Docker containers
- **Kindle Integration**: Email-to-Kindle delivery system
- **Rate Limiting**: Redis-based rate limiting and queuing
- **Caching**: Redis for session and temporary data storage

### System Architecture
```
User → Email Forward → ReadFlow Email Service → Content Parser → 
Kindle Converter → Kindle Delivery → User's Kindle Device
```

## 4. Feature Specifications

### 4.1 User Authentication & Onboarding
Based on ReadBetter.io's app structure analysis:

#### **Signup/Login Flow**
- **Email/Password**: Traditional email-based registration
- **Google OAuth**: One-click signup with Google account
- **Email Verification**: Secure account activation with verification link
- **Welcome Tutorial**: Interactive step-by-step setup guide
- **Subscription Selection**: Choose plan during signup (Starter $3/month or Pro $7/month)

#### **Personal Email Address Setup**
- **Unique Email Generation**: Each user gets a unique email address for sharing articles (e.g., user123@readflow.com)
- **Email Display**: Clear, prominent display of personal email address
- **Copy Function**: One-click copy to clipboard
- **Email Validation**: Verify email address format and availability

#### **Kindle Integration Setup**
- **Kindle Email Configuration**: Easy input field for Kindle email address
- **Device Verification**: Test email to verify Kindle email is correct
- **Multiple Devices**: Support for adding multiple Kindle devices
- **Setup Instructions**: Clear guide for finding Kindle email address

### 4.2 Main Dashboard Interface
Based on ReadBetter.io's dashboard structure:

#### **Dashboard Overview**
- **Recent Articles**: List of last 10 converted articles with thumbnails
- **Usage Statistics**: Current month usage vs. plan limits (e.g., "45/100 articles used")
- **Quick Actions**: Prominent "Forward Email" button and "View All Articles" link
- **Status Indicators**: Visual indicators for conversion status (pending, completed, failed)
- **Navigation Menu**: Clean sidebar with Settings, Help, Billing, Account sections

#### **Article Management**
- **Article Library**: Comprehensive list of all converted articles
- **Reading Status**: Visual indicators for read/unread articles (checkmark vs. circle)
- **Article Metadata**: Source, date, length, conversion status
- **Article Actions**: Delete, re-send to Kindle, download options
- **Search & Filter**: Find articles by source, date, or status
- **Bulk Operations**: Select multiple articles for batch actions

#### **Usage Tracking**
- **Monthly Usage**: Clear display of articles used vs. plan limit
- **Usage Alerts**: Notifications when approaching limits (80%, 90%, 100%)
- **Upgrade Prompts**: Suggest plan upgrade when approaching limits
- **Usage History**: Graph showing usage over time

### 4.2 Email Processing System
- **Email Reception**: Mailgun Inbound Email webhooks to `/api/email/receive`
- **Content Extraction**: Parse HTML email content from Mailgun payload
- **Image Handling**: Process and optimize images for Kindle using Calibre
- **Format Detection**: Identify newsletter source (Substack, Medium, etc.)
- **Error Handling**: Graceful handling of malformed emails with retry mechanism
- **Rate Limiting**: 10 emails per hour per user, 100 emails per hour globally
- **Queue System**: Redis-based queue for burst email handling

### 4.3 Content Conversion Engine
- **Conversion Tool**: Calibre CLI running in Docker containers
- **HTML to Kindle**: Convert HTML newsletters to EPUB format
- **Typography Optimization**: Clean, readable fonts and spacing via Calibre
- **Image Optimization**: Resize and compress images for Kindle automatically
- **Metadata Handling**: Preserve article titles, authors, dates in ebook format
- **Retry Logic**: Up to 3 conversion attempts with exponential backoff
- **Error Reporting**: Detailed failure logs for debugging

### 4.4 Kindle Delivery System
- **Email-to-Kindle**: Send converted files to user's Kindle via SMTP
- **Delivery Confirmation**: Track successful deliveries via email bounce handling
- **Retry Logic**: Up to 3 delivery attempts with exponential backoff
- **Format Validation**: Calibre ensures Kindle compatibility
- **Failed Delivery Notification**: Email user after all retries fail
- **File Cleanup**: Auto-delete delivered files after 7 days

### 4.5 User Dashboard
- **Usage Statistics**: Track articles processed, remaining quota
- **Conversion History**: View past conversions with timestamps
- **Settings Management**: Update Kindle email, subscription details
- **Billing Portal**: Manage subscription and payment methods
- **Support Access**: Contact information and help resources

### 4.6 Subscription Management
- **Tier System**: 
  - Starter: $3/month, 100 articles
  - Pro: $7/month, 300 articles
- **Usage Tracking**: Monitor article count against limits
- **Upgrade/Downgrade**: Seamless plan changes
- **Payment Processing**: Secure billing via Polar.sh
- **Usage Alerts**: Notifications when approaching limits

## 5. User Interface Design

### 5.1 Landing Page
Based on ReadBetter.io's successful landing page structure:

#### **Hero Section**
- **Primary Headline**: "Transform newsletters into distraction-free reading on your Kindle"
- **Subheadline**: "ReadFlow delivers your favorite email newsletters and articles to Kindle in native e-book format. Read without distractions and with less eye strain."
- **Primary CTA**: "Start Reading Better - $3/month" (emphasizing competitive pricing)
- **Secondary CTA**: "See How It Works" (demo or tutorial)
- **Social Proof**: "Join thousands of happy readers" with user count

#### **How It Works Section**
- **Step 1**: "Forward any newsletter to your unique ReadFlow email"
- **Step 2**: "We convert it to Kindle format automatically"
- **Step 3**: "Read distraction-free on your Kindle device"
- **Visual Flow**: Simple icons or illustrations for each step

#### **Pricing Section**
- **Competitive Display**: Side-by-side comparison with ReadBetter.io
- **Starter Plan**: $3/month for 100 articles (vs. $5/month for 50)
- **Pro Plan**: $7/month for 300 articles (vs. $10/month for 200)
- **Value Proposition**: "2x more articles per dollar"
- **Free Trial**: "7-day free trial, no credit card required"

### 5.2 Dashboard Design
Based on ReadBetter.io's dashboard structure:

#### **Main Dashboard Layout**
- **Top Navigation**: Logo, user menu, notifications
- **Sidebar Navigation**: Dashboard, Articles, Settings, Billing, Help
- **Main Content Area**: Recent articles, usage stats, quick actions
- **Mobile Responsive**: Collapsible sidebar for mobile devices

#### **Dashboard Components**
- **Usage Card**: Large, prominent display of monthly usage (e.g., "45/100 articles used")
- **Quick Actions**: "Forward Email" button and "View All Articles" link
- **Recent Articles**: Grid/list view of last 10 articles with thumbnails
- **Status Indicators**: Color-coded status for conversions (green=completed, yellow=pending, red=failed)

#### **Article Management Interface**
- **Article List**: Clean table with columns for title, source, date, status, actions
- **Reading Status**: Visual indicators (checkmark for read, circle for unread)
- **Article Actions**: Dropdown menu with delete, re-send, download options
- **Search & Filter**: Search bar and filter dropdowns
- **Bulk Selection**: Checkboxes for bulk operations

### 5.3 Key Pages Structure

#### **Settings Page**
- **Account Information**: Name, email, password change
- **Kindle Configuration**: Kindle email address, device management
- **Email Preferences**: Notification settings, conversion options
- **Subscription Management**: Current plan, upgrade/downgrade options

#### **Billing Page**
- **Current Plan**: Display current subscription and usage
- **Billing History**: List of past invoices and payments
- **Payment Method**: Add/update credit card information
- **Plan Comparison**: Side-by-side plan comparison for upgrades

#### **Help & Support Page**
- **FAQ Section**: Common questions and answers
- **Setup Guides**: Step-by-step instructions for different email clients
- **Troubleshooting**: Common issues and solutions
- **Contact Support**: Email and chat support options

### 5.4 Design System
- **Color Scheme**: Professional blues and grays with accent colors
- **Typography**: Clean, readable fonts (Inter or similar)
- **Icons**: Consistent icon set (Lucide React or similar)
- **Spacing**: Consistent 8px grid system
- **Components**: shadcn/ui components for consistency
- **Dark Mode**: Optional dark theme support

## 6. Technical Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Focus: Core functionality and basic infrastructure**
1. **Setup Starter Kit**: Clone and configure Next.js SaaS starter
2. **Database Schema**: Design tables for users, conversions, subscriptions
3. **Email Infrastructure**: Set up email processing service
4. **Basic UI**: Implement core dashboard and functionality
5. **Core Features**: Email processing and Kindle integration

### Phase 2: Core Features (Week 3-4)
**Focus: Complete user experience and advanced features**
1. **Email Processing**: Build email reception and parsing
2. **Content Conversion**: Implement HTML to Kindle conversion
3. **Kindle Integration**: Set up email-to-Kindle delivery
4. **Usage Tracking**: Monitor article counts and limits
5. **User Dashboard**: Complete dashboard functionality
6. **Article Management**: Full article library and management features

### Phase 3: Polish & Launch (Week 5-6)
**Focus: Branding, testing, and launch preparation**
1. **Brand Customization**: Update colors, logos, copy for ReadFlow
2. **Testing**: Comprehensive testing of all features
3. **Performance Optimization**: Speed and reliability improvements
4. **Documentation**: User guides and setup instructions
5. **Launch Preparation**: Final deployment and monitoring setup

## 7. Database Schema

### Users Table
```sql
users (
  id: uuid PRIMARY KEY,
  email: string UNIQUE,
  name: string,
  kindle_email: string,
  subscription_tier: enum('starter', 'pro'),
  subscription_status: enum('active', 'canceled', 'expired'),
  articles_used: integer DEFAULT 0,
  articles_limit: integer,
  created_at: timestamp,
  updated_at: timestamp
)
```

### Conversions Table
```sql
conversions (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  source_email: string,
  article_title: string,
  conversion_status: enum('pending', 'completed', 'failed'),
  file_url: string,
  created_at: timestamp,
  delivered_at: timestamp
)
```

### Subscriptions Table
```sql
subscriptions (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  polar_subscription_id: string,
  status: enum('active', 'canceled', 'expired'),
  current_period_start: timestamp,
  current_period_end: timestamp,
  created_at: timestamp
)
```

## 8. API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Email Processing
- `POST /api/email/receive` - Mailgun webhook for incoming emails
- `GET /api/email/address` - Get user's unique email address
- `POST /api/email/retry` - Retry failed email processing

### Conversions
- `GET /api/conversions` - List user's conversions with pagination
- `GET /api/conversions/:id` - Get specific conversion details
- `POST /api/conversions/retry` - Retry failed conversion (max 3 attempts)
- `DELETE /api/conversions/:id` - Delete conversion and associated files
- `GET /api/conversions/:id/download` - Download converted file (within 7 days)

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/usage` - Get usage statistics
- `PUT /api/user/kindle-email` - Update Kindle email

### Subscriptions
- `GET /api/subscriptions` - Get subscription details
- `POST /api/subscriptions/upgrade` - Upgrade subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

## 9. Security & Privacy

### Data Protection
- **Email Encryption**: Secure storage of email content
- **User Privacy**: No sharing of personal data
- **GDPR Compliance**: Data deletion and export capabilities
- **Secure API**: JWT authentication and rate limiting

### Content Security
- **Content Ownership**: Users retain rights to their content
- **Hybrid Storage Policy**: 
  - Successful conversions: Store files for 7 days, then auto-delete
  - Failed conversions: Store original email for 24 hours for retry, then delete
- **Privacy First**: No content analysis or tracking
- **Automatic Cleanup**: Daily cron job removes expired files

## 10. Performance Requirements

### Response Times
- **Email Processing**: < 5 minutes for conversion
- **Kindle Delivery**: < 10 minutes for delivery
- **Dashboard Loading**: < 2 seconds
- **API Responses**: < 500ms

### Scalability 
- **Concurrent Users**: Support 1000+ active users
- **Email Processing**: Handle 100+ emails per hour via Redis queue
- **Database**: Optimized queries and indexing with Neon PostgreSQL
- **CDN**: Cloudflare for global content delivery
- **Container Scaling**: Auto-scaling Docker containers for Calibre conversion
- **Backup Strategy**: 
  - Neon PostgreSQL automatic backups with point-in-time recovery
  - Daily database exports to Cloudflare R2
  - Dead letter queue for failed webhook deliveries

## 11. Monitoring & Analytics

### Key Metrics
- **Conversion Success Rate**: Track successful conversions
- **User Engagement**: Dashboard usage and feature adoption
- **Subscription Metrics**: Churn rate, upgrade rate
- **Performance Metrics**: Response times, error rates

### Error Tracking
- **Email Processing Errors**: Failed conversions and reasons
- **Kindle Delivery Failures**: Delivery issues and retry success
- **User Experience Issues**: UI/UX problems and feedback

## 12. Launch Strategy

### Beta Testing
- **Internal Testing**: Team testing of all features
- **Beta Users**: 50-100 users for feedback
- **Iteration**: Quick fixes based on feedback

### Launch Plan
- **Soft Launch**: Limited user signups
- **Marketing**: Content marketing and social media
- **Partnerships**: Newsletter creators and content platforms
- **Growth**: Referral program and word-of-mouth

## 13. Success Metrics

### Business Metrics
- **Monthly Recurring Revenue (MRR)**: Target $10K in 6 months
- **Customer Acquisition Cost (CAC)**: < $50 per customer
- **Customer Lifetime Value (CLV)**: > $200 per customer
- **Churn Rate**: < 5% monthly

### Product Metrics
- **Conversion Success Rate**: > 95%
- **User Satisfaction**: > 4.5/5 rating
- **Feature Adoption**: > 80% of users use core features
- **Support Tickets**: < 5% of users need support

## 14. Risk Assessment

### Technical Risks
- **Email Processing Failures**: Robust error handling and retry logic
- **Kindle Delivery Issues**: Multiple delivery methods and fallbacks
- **Scalability Challenges**: Cloud infrastructure and auto-scaling
- **Security Vulnerabilities**: Regular security audits and updates

### Business Risks
- **Competition**: Continuous innovation and competitive pricing
- **Market Changes**: Adapt to new reading platforms and formats
- **Regulatory Issues**: Compliance with email and privacy regulations
- **Technical Debt**: Regular code reviews and refactoring

## 15. Future Roadmap

### Phase 2 Features (3-6 months)
- **Mobile App**: Native iOS/Android apps
- **Advanced Formatting**: Custom reading preferences
- **Batch Processing**: Convert multiple articles at once
- **Analytics Dashboard**: Reading insights and statistics

### Phase 3 Features (6-12 months)
- **AI Summarization**: Automatic article summaries
- **Reading Lists**: Organize articles into collections
- **Social Features**: Share reading lists and recommendations
- **API Access**: Third-party integrations

### Long-term Vision (12+ months)
- **Multi-platform Support**: Support for other e-readers
- **Content Discovery**: AI-powered article recommendations
- **Publishing Platform**: Direct content creation tools
- **Enterprise Features**: Team and organization accounts

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: February 2025 