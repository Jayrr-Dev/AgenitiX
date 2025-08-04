# Production Setup Guide for Magic Link Authentication

## Overview

This guide will help you deploy the magic link authentication system to production with proper email service integration.

## 1. Email Service Setup (Resend)

### Step 1: Create Resend Account
1. Go to [Resend.com](https://resend.com)
2. Sign up for an account
3. Verify your email address

### Step 2: Get API Key
1. Go to the Resend dashboard
2. Navigate to "API Keys"
3. Click "Create API Key"
4. Copy the API key (starts with `re_`)

### Step 3: Domain Setup (Optional but Recommended)
1. Add your domain in Resend dashboard
2. Follow DNS verification steps
3. This allows emails from `noreply@yourdomain.com`

## 2. Environment Variables

Create a `.env.production` file or configure these in your deployment platform:

```env
# Required for production
RESEND_API_KEY=re_your_resend_api_key_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Convex (should already be configured)
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=https://your_convex_url

# Optional: Custom email domain
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 3. Deployment Platforms

### Vercel Deployment
1. **Environment Variables**:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add all the environment variables listed above
   - Make sure to set them for "Production" environment

2. **Domain Configuration**:
   - Add your custom domain in Vercel
   - Update `NEXT_PUBLIC_APP_URL` to match your domain

### Netlify Deployment
1. **Environment Variables**:
   - Go to Netlify dashboard → Your site → Settings → Environment variables
   - Add all the environment variables

2. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: .next
   ```

### Railway/Render Deployment
1. Add environment variables in the platform's dashboard
2. Configure the build command: `npm run build`
3. Set start command: `npm start`

## 4. Production Email Templates

The system automatically uses production-ready email templates. Here's what users will receive:

### Verification Email (Sign-up)
- Professional welcome message
- Secure magic link button
- 15-minute expiration notice
- Fallback plain text link

### Login Email (Sign-in)
- Clean sign-in message
- Magic link button
- Security reminders

## 5. Security Considerations

### Rate Limiting
- ✅ 3 magic link requests per hour per email
- ✅ Automatic reset after 1 hour
- ✅ Protected against abuse

### Token Security
- ✅ 15-minute expiration
- ✅ One-time use tokens
- ✅ Secure random generation (32 characters)

### Session Management
- ✅ 30-day session tokens
- ✅ IP address tracking
- ✅ User agent logging
- ✅ Session revocation capability

## 6. Monitoring and Logging

### Production Logging
The system logs important events:
- Failed email delivery attempts
- Authentication failures
- Rate limit violations

### Resend Dashboard
Monitor email delivery:
- Delivery rates
- Bounce rates
- Failed sends
- Email logs

## 7. Testing Production Setup

### Pre-deployment Testing
1. Test with Resend in staging environment
2. Verify all environment variables
3. Test email delivery with real email addresses

### Post-deployment Testing
1. Test sign-up flow with new email
2. Test sign-in flow with existing account
3. Verify email delivery and formatting
4. Test on different devices/browsers

## 8. Troubleshooting

### Common Issues

#### Emails Not Sending
1. **Check Resend API Key**: Ensure it's correctly set in environment variables
2. **Domain Verification**: If using custom domain, ensure DNS is configured
3. **Rate Limits**: Check Resend dashboard for rate limit issues
4. **Logs**: Check application logs for error messages

#### Magic Links Not Working
1. **URL Configuration**: Ensure `NEXT_PUBLIC_APP_URL` matches your domain
2. **HTTPS**: Ensure your production site uses HTTPS
3. **Token Expiration**: Links expire after 15 minutes

#### Authentication Errors
1. **Convex Connection**: Ensure Convex deployment is properly configured
2. **Database**: Check Convex dashboard for database issues
3. **CORS**: Ensure your domain is allowed in Convex settings

### Debug Commands

```bash
# Check environment variables
echo $RESEND_API_KEY
echo $NEXT_PUBLIC_APP_URL

# Test email sending (create a test endpoint)
curl -X POST https://yourdomain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 9. Production Checklist

Before going live:

- [ ] Resend account created and verified
- [ ] API key generated and stored securely
- [ ] Domain added to Resend (optional)
- [ ] Environment variables configured
- [ ] Production deployment completed
- [ ] Custom domain configured (if applicable)
- [ ] Email templates tested
- [ ] Authentication flow tested end-to-end
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Monitoring set up

## 10. Maintenance

### Regular Tasks
1. **Monitor Email Delivery**: Check Resend dashboard weekly
2. **Review Logs**: Check for authentication errors
3. **Update Dependencies**: Keep packages up to date
4. **Security Audits**: Regular security reviews

### Scaling Considerations
- Resend free tier: 3,000 emails/month
- Paid plans available for higher volume
- Consider implementing email queues for high traffic

## 11. Cost Estimates

### Resend Pricing
- **Free Tier**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **Business**: $85/month for 200,000 emails

### Infrastructure
- Vercel: Free tier available, $20/month for pro features
- Convex: Free tier for development, usage-based pricing
- Domain: ~$10-15/year

## 12. Support and Documentation

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## Quick Production Deploy

If you're ready to deploy immediately:

1. **Set up Resend** (5 minutes)
2. **Configure environment variables** (2 minutes)
3. **Deploy to Vercel/Netlify** (5 minutes)
4. **Test the flow** (5 minutes)

Total time: ~15-20 minutes for a complete production setup!