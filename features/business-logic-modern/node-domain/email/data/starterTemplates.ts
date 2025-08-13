/**
 * Route: features/business-logic-modern/node-domain/email/data/starterTemplates.ts
 * STARTER EMAIL TEMPLATES - Pre-built templates for common use cases
 *
 * • Professional templates based on React Email examples
 * • Covers authentication, verification, welcome, and transactional emails
 * • Ready-to-use HTML with placeholder variables
 * • Consistent branding and design patterns
 *
 * Keywords: starter-templates, react-email, email-templates, pre-built
 */

export interface StarterTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  description: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  previewImage?: string;
  tags: string[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "agenitix-magic-link",
    name: "Magic Link Authentication",
    category: "authentication",
    subject: "🚀 Your {{type}} magic link is here",
    description: "Professional magic link email for user authentication and verification with security messaging",
    variables: ["name", "magicLinkUrl", "type", "requestFromIp", "requestFromLocation"],
    tags: ["auth", "login", "verification", "security"],
    textContent: `Hello {{name}},

{{#if type === "verification"}}
Thanks for signing up! You're just one click away from building powerful automation workflows. Click the link below to verify your account and get started.
{{else}}
Click the link below to sign in to your account and continue building your automation workflows.
{{/if}}

Magic Link: {{magicLinkUrl}}

Security note: This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.

{{#if requestFromIp}}
This request was sent from {{requestFromIp}}{{#if requestFromLocation}} located in {{requestFromLocation}}{{/if}}.
{{/if}}

Best regards,
Your Team`,
    htmlContent: `<mjml>
  <mj-head>
    <mj-title>{{#if type === "verification"}}Welcome - Verify your account{{else}}Sign in - Your magic link is ready{{/if}}</mj-title>
    <mj-preview>{{#if type === "verification"}}Welcome! Verify your account to get started{{else}}Your magic link is ready - sign in now{{/if}}</mj-preview>
  </mj-head>
  <mj-body background-color="#f6f9fc">
    <mj-section background-color="#ffffff" border-radius="8px" padding="40px 20px">
      
      <!-- Header with Branding -->
      <mj-column>
        <mj-spacer height="20px" />
        <mj-section background-color="transparent" background-image="linear-gradient(to right, #3b82f6, #8b5cf6)" border-radius="8px" padding="24px">
          <mj-column>
            <mj-text align="center" font-size="24px" color="#ffffff">🚀</mj-text>
            <mj-text align="center" font-size="28px" font-weight="bold" color="#ffffff" line-height="1.2">
              {{#if type === "verification"}}Welcome to Your Platform!{{else}}Sign in to Your Platform{{/if}}
            </mj-text>
            <mj-text align="center" font-size="16px" color="rgba(255, 255, 255, 0.9)" line-height="1.4">
              {{#if type === "verification"}}Visual Flow Automation Platform{{else}}Your magic link is ready{{/if}}
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-spacer height="32px" />
        
        <!-- Main Content -->
        <mj-text font-size="16px" color="#000000" line-height="1.5">
          Hello {{name}},
        </mj-text>
        
        <mj-text font-size="16px" color="#000000" line-height="1.5">
          {{#if type === "verification"}}
          Thanks for signing up! You're just one click away from building powerful automation workflows. Click the button below to verify your account and get started.
          {{else}}
          Click the button below to sign in to your account and continue building your automation workflows.
          {{/if}}
        </mj-text>
        
        <!-- CTA Button -->
        <mj-button background-color="#3b82f6" color="#ffffff" font-weight="600" font-size="16px" border-radius="6px" href="{{magicLinkUrl}}" padding="16px 24px">
          {{#if type === "verification"}}✨ Verify Account & Sign In{{else}}🚀 Sign In to Platform{{/if}}
        </mj-button>
        
        <!-- Fallback Link -->
        <mj-text font-size="14px" color="#000000" line-height="1.5">
          or copy and paste this URL into your browser: 
          <a href="{{magicLinkUrl}}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">{{magicLinkUrl}}</a>
        </mj-text>
        
        <!-- Security Notice -->
        <mj-section background-color="#f9fafb" border-left="4px solid #3b82f6" border-radius="8px" padding="16px">
          <mj-column>
            <mj-text font-size="14px" color="#4b5563" line-height="1.4">
              <strong>Security note:</strong> This link will expire in 15 minutes for your security.
              {{#if type === "verification"}}If you didn't create an account{{else}}If you didn't request this{{/if}}, you can safely ignore this email.
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-divider border-color="#eaeaea" border-width="1px" />
        
        <!-- Footer with Security Info -->
        {{#if requestFromIp}}
        <mj-text font-size="12px" color="#666666" line-height="1.5">
          This request was sent from <span style="color: #000000;">{{requestFromIp}}</span>
          {{#if requestFromLocation}} located in <span style="color: #000000;">{{requestFromLocation}}</span>{{/if}}.
          If you are concerned about your account's safety, please contact our support team.
        </mj-text>
        {{/if}}
        
        <!-- Company Footer -->
        <mj-text align="center" font-size="12px" color="#666666" line-height="1.5">
          © 2025 Your Company. All rights reserved.<br/>
          <a href="#" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
          <a href="#" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
  },
  
  {
    id: "notion-style-login",
    name: "Simple Login Code",
    category: "authentication",
    subject: "Log in with this magic code",
    description: "Clean and minimal login email with temporary access code, inspired by Notion's design",
    variables: ["loginCode"],
    tags: ["auth", "login", "code", "minimal"],
    textContent: `Login

Click here to log in with this magic link, or copy and paste this temporary login code:

{{loginCode}}

If you didn't try to login, you can safely ignore this email.

Hint: You can set a permanent password in your account settings.

Your Platform
The all-in-one workspace for your automation needs.`,
    htmlContent: `<mjml>
  <mj-head>
    <mj-title>Log in with this magic code</mj-title>
    <mj-preview>Your temporary login code is ready</mj-preview>
  </mj-head>
  <mj-body background-color="#ffffff">
    <mj-section background-color="#ffffff" padding="40px 20px">
      <mj-column>
        
        <mj-text font-size="24px" font-weight="bold" color="#333333" line-height="1.2">
          Login
        </mj-text>
        
        <mj-button background-color="transparent" color="#2754C5" font-size="14px" text-decoration="underline" align="left" inner-padding="0" padding="16px 0">
          Click here to log in with this magic link
        </mj-button>
        
        <mj-text font-size="14px" color="#333333" line-height="1.5" padding-bottom="14px">
          Or, copy and paste this temporary login code:
        </mj-text>
        
        <mj-section background-color="#f4f4f4" border="1px solid #eee" border-radius="5px" padding="16px">
          <mj-column>
            <mj-text align="center" font-size="18px" font-weight="bold" color="#333333" font-family="monospace" letter-spacing="2px">
              {{loginCode}}
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-text font-size="14px" color="#ababab" line-height="1.5" padding-top="14px" padding-bottom="16px">
          If you didn't try to login, you can safely ignore this email.
        </mj-text>
        
        <mj-text font-size="14px" color="#ababab" line-height="1.5" padding-bottom="38px">
          Hint: You can set a permanent password in Settings & Account.
        </mj-text>
        
        <mj-section background-color="#f0f0f0" border-radius="4px" padding="8px" width="32px">
          <mj-column>
            <mj-spacer height="16px" />
          </mj-column>
        </mj-section>
        
        <mj-text font-size="12px" color="#898989" line-height="1.8" padding-top="12px">
          <a href="#" style="color: #898989; text-decoration: none;">Your Platform</a>, the all-in-one workspace<br/>
          for your automation, workflows, and data processing needs.
        </mj-text>
        
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
  },

  {
    id: "plaid-verification",
    name: "Identity Verification Code",
    category: "verification",
    subject: "Verify Your Identity - Code: {{validationCode}}",
    description: "Professional verification email with prominent code display for identity verification",
    variables: ["validationCode", "serviceName"],
    tags: ["verification", "security", "code", "identity"],
    textContent: `Verify Your Identity

Enter the following code to finish the verification process:

{{validationCode}}

Not expecting this email?

Contact support if you did not request this code.

Securely powered by {{serviceName}}.`,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify Your Identity</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: HelveticaNeue, Helvetica, Arial, sans-serif;">
  <div style="background-color: #ffffff; border: 1px solid #eee; border-radius: 5px; box-shadow: 0 5px 10px rgba(20,50,70,.2); margin: 20px auto 0; max-width: 360px; padding: 68px 0 130px;">
    
    <div style="width: 212px; height: 88px; background-color: #f0f0f0; margin: 0 auto; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #333;">
      🔐 LOGO
    </div>
    
    <p style="color: #0a85ea; font-size: 11px; font-weight: 700; height: 16px; letter-spacing: 0; line-height: 16px; margin: 16px 8px 8px 8px; text-transform: uppercase; text-align: center;">
      Verify Your Identity
    </p>
    
    <h2 style="color: #000; display: inline-block; font-family: HelveticaNeue-Medium, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 500; line-height: 24px; margin: 0; text-align: center; width: 100%;">
      Enter the following code to finish verification.
    </h2>
    
    <div style="background: rgba(0,0,0,.05); border-radius: 4px; margin: 16px auto 14px; vertical-align: middle; width: 280px;">
      <p style="color: #000; display: inline-block; font-family: HelveticaNeue-Bold; font-size: 32px; font-weight: 700; letter-spacing: 6px; line-height: 40px; padding: 8px 0; margin: 0 auto; width: 100%; text-align: center;">
        {{validationCode}}
      </p>
    </div>
    
    <p style="color: #444; font-size: 15px; letter-spacing: 0; line-height: 23px; padding: 0 40px; margin: 0; text-align: center;">
      Not expecting this email?
    </p>
    
    <p style="color: #444; font-size: 15px; letter-spacing: 0; line-height: 23px; padding: 0 40px; margin: 0; text-align: center;">
      Contact <a href="mailto:support@yourplatform.com" style="color: #444; text-decoration: underline;">support@yourplatform.com</a> if you did not request this code.
    </p>
  </div>
  
  <p style="color: #000; font-size: 12px; font-weight: 800; letter-spacing: 0; line-height: 23px; margin: 20px 0 0; text-align: center; text-transform: uppercase;">
    Securely powered by {{serviceName}}.
  </p>
</body>
</html>`,
  },

  {
    id: "stripe-welcome",
    name: "Account Activation Welcome",
    category: "welcome",
    subject: "🎉 You're now ready to go live!",
    description: "Professional welcome email for account activation with next steps and resources",
    variables: ["dashboardUrl", "docsUrl", "supportUrl"],
    tags: ["welcome", "activation", "onboarding", "resources"],
    textContent: `You're now ready to make live transactions!

Thanks for submitting your account information. You're now ready to start using our platform!

You can view your dashboard and manage your account settings right from your control panel.

View your Dashboard: {{dashboardUrl}}

If you haven't finished your integration, you might find our documentation handy: {{docsUrl}}

We'll be here to help you with any step along the way. You can find answers to most questions and get in touch with us on our support site: {{supportUrl}}

— The Team`,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're now ready to make live transactions!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px;">
    <div style="padding: 0 48px;">
      
      <div style="width: 49px; height: 21px; background-color: #f0f0f0; margin-bottom: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333; font-size: 12px;">
        LOGO
      </div>
      
      <hr style="border-color: #e6ebf1; margin: 20px 0;">
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
        Thanks for submitting your account information. You're now ready to make live transactions with our platform!
      </p>
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
        You can view your payments and a variety of other information about your account right from your dashboard.
      </p>
      
      <a href="{{dashboardUrl}}" style="background-color: #656ee8; border-radius: 5px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; width: 100%; padding: 10px; margin: 20px 0;">
        View your Dashboard
      </a>
      
      <hr style="border-color: #e6ebf1; margin: 20px 0;">
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
        If you haven't finished your integration, you might find our <a href="{{docsUrl}}" style="color: #556cd6;">documentation</a> handy.
      </p>
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
        Once you're ready to start accepting payments, you'll just need to use your live API keys instead of your test API keys. Your account can simultaneously be used for both test and live requests, so you can continue testing while accepting live payments.
      </p>
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">
        We'll be here to help you with any step along the way. You can find answers to most questions and get in touch with us on our <a href="{{supportUrl}}" style="color: #556cd6;">support site</a>.
      </p>
      
      <p style="color: #525f7f; font-size: 16px; line-height: 24px; text-align: left;">— The Team</p>
      
      <hr style="border-color: #e6ebf1; margin: 20px 0;">
      
      <p style="color: #8898aa; font-size: 12px; line-height: 16px;">
        Your Company, 123 Business St, Your City, State 12345
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  {
    id: "vercel-team-invite",
    name: "Team Invitation",
    category: "invitation",
    subject: "{{invitedByUsername}} invited you to join {{teamName}}",
    description: "Professional team invitation email with clear call-to-action and security information",
    variables: ["username", "invitedByUsername", "invitedByEmail", "teamName", "inviteLink", "inviteFromIp", "inviteFromLocation"],
    tags: ["invitation", "team", "collaboration", "security"],
    textContent: `Join {{teamName}}

Hello {{username}},

{{invitedByUsername}} ({{invitedByEmail}}) has invited you to the {{teamName}} team.

Accept Invitation: {{inviteLink}}

or copy and paste this URL into your browser: {{inviteLink}}

This invitation was intended for {{username}}. This invite was sent from {{inviteFromIp}} located in {{inviteFromLocation}}. If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.`,
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Join {{teamName}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <div style="max-width: 465px; margin: 40px auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
    
    <div style="margin-top: 32px; text-align: center;">
      <div style="width: 40px; height: 37px; background-color: #f0f0f0; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333; font-size: 14px;">
        LOGO
      </div>
    </div>
    
    <h1 style="margin: 30px 0; padding: 0; text-align: center; font-weight: normal; font-size: 24px; color: #000000;">
      Join <strong>{{teamName}}</strong> on <strong>Your Platform</strong>
    </h1>
    
    <p style="font-size: 14px; color: #000000; line-height: 24px;">
      Hello {{username}},
    </p>
    
    <p style="font-size: 14px; color: #000000; line-height: 24px;">
      <strong>{{invitedByUsername}}</strong> (<a href="mailto:{{invitedByEmail}}" style="color: #3b82f6; text-decoration: none;">{{invitedByEmail}}</a>) has invited you to the <strong>{{teamName}}</strong> team on <strong>Your Platform</strong>.
    </p>
    
    <div style="margin: 32px 0; text-align: center;">
      <a href="{{inviteLink}}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 12px; padding: 12px 20px; border-radius: 4px;">
        Join the team
      </a>
    </div>
    
    <p style="font-size: 14px; color: #000000; line-height: 24px;">
      or copy and paste this URL into your browser: <a href="{{inviteLink}}" style="color: #3b82f6; text-decoration: none;">{{inviteLink}}</a>
    </p>
    
    <hr style="margin: 26px 0; border: none; border-top: 1px solid #eaeaea;">
    
    <p style="color: #666666; font-size: 12px; line-height: 24px;">
      This invitation was intended for <span style="color: #000000;">{{username}}</span>. This invite was sent from <span style="color: #000000;">{{inviteFromIp}}</span> located in <span style="color: #000000;">{{inviteFromLocation}}</span>. If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.
    </p>
  </div>
</body>
</html>`,
  },
];

export const getStarterTemplatesByCategory = () => {
  const categorized = STARTER_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, StarterTemplate[]>);

  return categorized;
};

export const getStarterTemplateById = (id: string) => {
  return STARTER_TEMPLATES.find(template => template.id === id);
};

export const searchStarterTemplates = (query: string) => {
  const searchTerm = query.toLowerCase();
  return STARTER_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.subject.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};
