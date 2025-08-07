# OAuth CORS Configuration for Local Development

This guide explains how to properly configure CORS (Cross-Origin Resource Sharing) for OAuth flows in local development.

## **🔧 Why CORS Matters for OAuth**

OAuth flows involve cross-origin requests between:
- Your localhost application (`http://localhost:3000`)
- OAuth providers (Google, Microsoft, etc.)
- Popup windows and iframes

Without proper CORS configuration, you'll encounter errors like:
- `Access to fetch at 'http://localhost:3000/api/auth/email/gmail' from origin 'null' has been blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header is present on the requested resource`

## **📋 CORS Configuration Steps**

### **1. Environment Variables**

Ensure your environment variables are set correctly:

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# OAuth redirect URIs
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/email/gmail/callback
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/email/outlook/callback
```

### **2. OAuth Provider Configuration**

#### **Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/email/gmail/callback
   http://127.0.0.1:3000/api/auth/email/gmail/callback
   ```

#### **Microsoft Azure**
1. Go to [Azure App Registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Edit your app registration
3. Add these **Redirect URIs**:
   ```
   http://localhost:3000/api/auth/email/outlook/callback
   http://127.0.0.1:3000/api/auth/email/outlook/callback
   ```

### **3. Next.js API Route CORS**

Your OAuth API routes now include proper CORS headers:

```typescript
// lib/cors.ts - CORS configuration utility
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : process.env.NEXT_PUBLIC_BASE_URL,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};
```

### **4. Middleware CORS Handling**

The middleware automatically adds CORS headers for OAuth routes:

```typescript
// middleware.ts
if (pathname.startsWith('/api/auth') || request.nextUrl.searchParams.has('code')) {
  const response = await convexMiddleware(request);
  
  // Add CORS headers for OAuth development
  if (process.env.NODE_ENV === "development") {
    response.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  return response;
}
```

## **🧪 Testing CORS Configuration**

### **1. Test OAuth Initiation**
```bash
# Test Gmail OAuth initiation
curl -X GET "http://localhost:3000/api/auth/email/gmail" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json"
```

### **2. Test Preflight Requests**
```bash
# Test OPTIONS preflight
curl -X OPTIONS "http://localhost:3000/api/auth/email/gmail" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

### **3. Browser Console Testing**
```javascript
// Test from browser console
fetch('http://localhost:3000/api/auth/email/gmail', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(response => {
  console.log('CORS test successful:', response.status);
}).catch(error => {
  console.error('CORS test failed:', error);
});
```

## **🔍 Common CORS Issues & Solutions**

### **Issue 1: "No 'Access-Control-Allow-Origin' header"**
**Solution:**
- Ensure your API routes include CORS headers
- Check that `NODE_ENV=development` is set
- Verify the origin matches exactly (`http://localhost:3000`)

### **Issue 2: "Credentials not supported"**
**Solution:**
- Add `"Access-Control-Allow-Credentials": "true"` header
- Ensure `credentials: 'include'` in fetch requests

### **Issue 3: "Method not allowed"**
**Solution:**
- Add `OPTIONS` to allowed methods
- Handle preflight requests properly

### **Issue 4: "Request header not allowed"**
**Solution:**
- Include all required headers in `Access-Control-Allow-Headers`
- Common headers: `Content-Type`, `Authorization`, `X-Requested-With`

## **🚀 Production CORS Configuration**

For production, update the CORS configuration:

```typescript
// lib/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com",
  // ... other headers
};
```

## **🔒 Security Considerations**

### **Development vs Production**
- **Development**: Allow `http://localhost:3000` and `http://127.0.0.1:3000`
- **Production**: Only allow your specific domain

### **OAuth Security Headers**
```typescript
export const oauthCorsHeaders = {
  ...corsHeaders,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
```

## **📝 Debugging Checklist**

- [ ] Environment variables set correctly
- [ ] OAuth provider redirect URIs configured
- [ ] CORS headers added to API routes
- [ ] Middleware handles OAuth routes
- [ ] Preflight requests handled
- [ ] Browser popup blockers disabled
- [ ] Network tab shows successful requests
- [ ] Console shows no CORS errors

## **🔗 Additional Resources**

- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
