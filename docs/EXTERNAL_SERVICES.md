# External Services Documentation

This document outlines all external services and dependencies required to run AgenitiX.

## 🔧 Required Services

### Convex (Database & Backend)

- **Purpose**: Real-time database and serverless functions
- **Setup**:
  1. Create account at [convex.dev](https://convex.dev)
  2. Create new project
  3. Get deployment URL and deployment name
  4. Set environment variables:
     - `NEXT_PUBLIC_CONVEX_URL`
     - `CONVEX_DEPLOYMENT`
     - `CONVEX_DEPLOY_KEY` (for production)

### Resend (Email Service)

- **Purpose**: Transactional emails and magic link authentication
- **Setup**:
  1. Create account at [resend.com](https://resend.com)
  2. Generate API key
  3. Set environment variables:
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `AUTH_RESEND_KEY` (for auth emails)
     - `RESEND_WEBHOOK_SECRET` (optional)

## 🔌 Optional Services

### Gmail Integration

- **Purpose**: Gmail API access for email workflows
- **Setup**:
  1. Create Google Cloud Project
  2. Enable Gmail API
  3. Create OAuth 2.0 credentials
  4. Set environment variables:
     - `GMAIL_CLIENT_ID`
     - `GMAIL_CLIENT_SECRET`
     - `GMAIL_REDIRECT_URI`

### Google Sheets

- **Purpose**: Google Sheets integration for data workflows
- **Setup**:
  1. Enable Google Sheets API in Google Cloud Console
  2. Generate API key
  3. Set environment variable:
     - `GOOGLE_SHEETS_API_KEY`

### Sentry (Error Tracking)

- **Purpose**: Error monitoring and performance tracking
- **Setup**:
  1. Create account at [sentry.io](https://sentry.io)
  2. Create new project
  3. Get DSN
  4. Set environment variables:
     - `NEXT_PUBLIC_SENTRY_DSN`
     - `SENTRY_AUTH_TOKEN` (for source maps)

### Vercel (Deployment)

- **Purpose**: Hosting and deployment platform
- **Setup**:
  1. Create account at [vercel.com](https://vercel.com)
  2. Connect GitHub repository
  3. Set environment variables in Vercel dashboard
  4. Deploy automatically on push

## 🔐 Authentication Setup

### Auth Secret Generation

```bash
# Generate a secure auth secret
openssl rand -base64 32
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## 📧 Email Configuration

### Resend Setup

1. **Create Account**: Sign up at [resend.com](https://resend.com)
2. **Verify Domain**: Add and verify your sending domain
3. **Generate API Key**: Create API key in dashboard
4. **Configure From Email**: Set verified email address

### Gmail API Setup

1. **Enable Gmail API**: In Google Cloud Console
2. **Create Credentials**: OAuth 2.0 client ID
3. **Configure Scopes**:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`

## 🚀 Deployment Services

### Vercel Configuration

- **Environment Variables**: Set all required env vars in Vercel dashboard
- **Build Settings**:
  - Build Command: `pnpm build`
  - Output Directory: `.next`
- **Domain**: Configure custom domain if needed

### Convex Production

- **Deploy Functions**: `pnpm convex:deploy`
- **Set Deploy Key**: For automated deployments
- **Configure Webhooks**: If using webhook triggers

## 🔍 Monitoring & Analytics

### Sentry Setup

1. **Create Project**: In Sentry dashboard
2. **Get DSN**: Copy project DSN
3. **Configure Source Maps**: For better error tracking
4. **Set Release**: For version tracking

### Performance Monitoring

- **Web Vitals**: Built-in Next.js analytics
- **Custom Metrics**: Via Sentry or custom implementation

## 🛠️ Development Tools

### Local Development

- **Convex Dev**: `npx convex dev`
- **Next.js Dev**: `pnpm dev`
- **Email Testing**: Use Resend test mode

### Testing Services

- **Convex Functions**: `pnpm test:convex`
- **Frontend Tests**: `pnpm test`
- **E2E Tests**: `pnpm test:e2e`

## 📋 Service Limits & Considerations

### Convex

- **Free Tier**: 1M function calls/month
- **Database**: 1GB storage
- **Rate Limits**: Varies by plan

### Resend

- **Free Tier**: 3,000 emails/month
- **Rate Limits**: 100 emails/second
- **Domain Verification**: Required for production

### Gmail API

- **Quota**: 1B quota units/day
- **Rate Limits**: 250 quota units/user/second
- **Scopes**: Limited by OAuth consent

### Google Sheets API

- **Quota**: 100 requests/100 seconds/user
- **Rate Limits**: 300 requests/100 seconds
- **Authentication**: API key or OAuth

## 🔧 Troubleshooting

### Common Issues

1. **Convex Connection**: Check deployment URL and key
2. **Email Delivery**: Verify domain and API key
3. **Gmail Auth**: Check OAuth configuration
4. **Environment Variables**: Ensure all required vars are set

### Debug Tools

- **Convex Dashboard**: Monitor functions and data
- **Resend Dashboard**: Track email delivery
- **Google Cloud Console**: Monitor API usage
- **Sentry Dashboard**: View errors and performance

## 📞 Support

- **Convex**: [docs.convex.dev](https://docs.convex.dev)
- **Resend**: [resend.com/docs](https://resend.com/docs)
- **Gmail API**: [developers.google.com/gmail](https://developers.google.com/gmail)
- **Sentry**: [docs.sentry.io](https://docs.sentry.io)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

