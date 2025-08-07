# 🚀 Quick Production Deploy Guide

## 15-Minute Production Setup

### Step 1: Get Resend API Key (2 minutes)
1. Go to [resend.com](https://resend.com)
2. Sign up and verify email
3. Create API key (starts with `re_`)

### Step 2: Deploy to Vercel (3 minutes)
1. Connect GitHub repo to Vercel
2. Add environment variables:
   ```
   RESEND_API_KEY=re_your_api_key_here
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```
3. Deploy

### Step 3: Test (5 minutes)
1. Visit your deployed site
2. Try sign-up flow
3. Check email delivery
4. Test magic link

### Step 4: Monitor (ongoing)
- Check Resend dashboard for delivery stats
- Monitor application logs for errors

---

## Environment Variables Quick Copy

For Vercel Dashboard → Settings → Environment Variables:

```
RESEND_API_KEY=re_your_actual_api_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RESEND_FROM_EMAIL=noreply@yourdomain.com (optional)
```

---

## Test Commands

Check if production is ready:
```bash
pnpm run check:production
```

Test locally with production build:
```bash
pnpm run build
pnpm start
```

---

## Troubleshooting

**Emails not sending?**
- Check Resend API key is correct
- Verify in Resend dashboard
- Check application logs

**Magic links not working?**
- Ensure NEXT_PUBLIC_APP_URL matches your domain
- Check HTTPS is enabled
- Verify Convex deployment is working

**Authentication errors?**
- Check Convex configuration
- Verify all environment variables
- Test in development first

---

## Support

- 📖 Full guide: `PRODUCTION_SETUP.md`
- 🔧 Check readiness: `pnpm run check:production`
- 📧 Resend docs: [resend.com/docs](https://resend.com/docs)
- 🌐 Vercel docs: [vercel.com/docs](https://vercel.com/docs)