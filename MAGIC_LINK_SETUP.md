# Magic Link Authentication Setup

## Overview

The magic link authentication system is now implemented and working. Here's what's been set up:

## Components

### 1. Backend (Convex)
- **`convex/auth.ts`**: Complete authentication system with:
  - User registration with magic link
  - Magic link generation and verification
  - Session management
  - Rate limiting (3 attempts per hour)
  - Email verification

### 2. Frontend (Next.js)
- **`hooks/useAuth.ts`**: Authentication hook with:
  - Sign up with magic link
  - Sign in with magic link
  - Session management
  - Token storage

- **`app/api/auth/send-magic-link/route.ts`**: API endpoint for sending magic link emails

### 3. Email Service
- **`lib/email-service.ts`**: Email service with:
  - Development: Console logging with magic link URLs
  - Production: Resend email service integration
  - Beautiful HTML email templates

### 4. UI Components
- **`app/(auth-pages)/sign-in/page.tsx`**: Sign in page
- **`app/(auth-pages)/sign-up/page.tsx`**: Sign up page
- **`app/auth/verify/page.tsx`**: Magic link verification page
- **`components/auth/MagicLinkTest.tsx`**: Development test component

## How It Works

### Sign Up Flow
1. User enters email and name on sign-up page
2. Convex creates user account (unverified)
3. Magic link is generated and sent via email
4. User clicks link in email
5. Account is verified and user is signed in
6. User is redirected to dashboard

### Sign In Flow
1. User enters email on sign-in page
2. Convex generates new magic link
3. Magic link is sent via email
4. User clicks link in email
5. User is signed in and redirected to dashboard

## Development Testing

### Test Component
A test component is available in development mode:
- Located at bottom-right corner of the screen
- Allows testing both sign-in and sign-up flows
- Shows authentication status
- Magic links are logged to console

### Console Logging
In development mode:
- Magic link URLs are logged to console
- Copy the URL to test authentication
- No actual emails are sent

## Production Setup

### Environment Variables
For production, you'll need:

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Email Service Setup
1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Add to environment variables
4. The system will use Resend for sending emails

## Security Features

### Rate Limiting
- Maximum 3 magic link requests per hour per email
- Automatic reset after 1 hour
- Prevents abuse

### Token Security
- Magic links expire after 15 minutes
- One-time use tokens
- Secure random generation

### Session Management
- 30-day session tokens
- IP address and user agent tracking
- Session revocation capability

## Database Schema

### auth_users Table
- Email, name, company, role
- Email verification status
- Magic link tokens and expiration
- Rate limiting fields

### auth_sessions Table
- Session tokens and expiration
- IP address and user agent
- Active session tracking

## Testing the Magic Link Flow

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Test sign-up**:
   - Go to `/sign-up`
   - Enter email and name
   - Check console for magic link URL
   - Copy and paste the URL to test

3. **Test sign-in**:
   - Go to `/sign-in`
   - Enter email
   - Check console for magic link URL
   - Copy and paste the URL to test

4. **Use the test component**:
   - Look for the test component in bottom-right corner
   - Use it to quickly test both flows

## Troubleshooting

### Common Issues

1. **Magic link not working**:
   - Check console for the exact URL
   - Ensure you're using the full URL
   - Check if token has expired (15 minutes)

2. **Rate limiting**:
   - Wait 1 hour or use a different email
   - Check console for retry information

3. **Email not sending**:
   - In development: Check console logs
   - In production: Check Resend API key

### Debug Information
- All magic link URLs are logged to console in development
- Error messages are displayed in the UI
- Toast notifications provide feedback

## Next Steps

1. **Test the flow** using the development server
2. **Set up Resend** for production emails
3. **Configure environment variables** for production
4. **Test with real email addresses** in production

The magic link authentication system is now fully functional and ready for use! 