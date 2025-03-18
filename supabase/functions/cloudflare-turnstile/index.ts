// supabase/functions/cloudflare-turnstile/index.ts
// Deploy with:
// supabase functions deploy cloudflare-turnstile
// supabase secrets set CLOUDFLARE_SECRET_KEY=your_secret_key

import { corsHeaders } from '../_shared/cors';

console.log('Hello from Cloudflare Turnstile!')

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

// For Supabase Edge Functions, use Deno.serve directly (without import)
// @ts-ignore
Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    const clientIps = ips(req) || ['']
    const ip = clientIps[0]

    // Validate the token by calling the
    // "/siteverify" API endpoint.
    let formData = new FormData()
    // @ts-ignore
    formData.append('secret', Deno.env.get('CLOUDFLARE_SECRET_KEY') ?? '')
    formData.append('response', token)
    formData.append('remoteip', ip)

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    })

    const outcome = await result.json()
    console.log(outcome)
    if (outcome.success) {
      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ success: false, error: outcome['error-codes'] }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})