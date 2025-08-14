/**
 * STARTER EMAIL TEMPLATES (GrapesJS + MJML Edition)
 * - Beautiful, accessible, and broadly compliant
 * - Dark-mode aware, mobile-first spacing, bulletproof buttons
 * - Tokens: {{token}} placeholders (no runtime conditionals)
 *
 * Best practice highlights:
 * • Use hidden preheader via mj-raw (GrapesJS-safe); avoid <mj-preview> in editor
 * • Centralize fonts, link, and text styles via <mj-attributes>
 * • Keep max-width 600px, generous line-height, clear hierarchy
 * • Strong color contrast; dark mode adjustments via <mj-style>
 * • Always include physical address + unsubscribe
 */

export type TemplateCategory =
  | "authentication"
  | "verification"
  | "welcome"
  | "invitation"
  | "transactional"
  | "account"
  | "newsletter";

export interface TemplateVariable {
  /** Variable token without braces, e.g., "magicLinkUrl" */
  name: string;
  /** Short explanation for GrapesJS trait/help */
  description: string;
  /** Example value for preview/mock */
  example?: string;
  /** Whether this variable is required prior to send */
  required?: boolean;
}

export interface StarterTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  description: string;
  /** MJML content (GrapesJS MJML plugin will render it) */
  mjml: string;
  /** Fallback text body for clients that prefer text/plain */
  text: string;
  /** Declared variables for your pipeline/UI */
  variables: TemplateVariable[];
  /** Optional tags for search */
  tags?: string[];
  /** Optional preview image for catalog UIs */
  previewImage?: string;
}

/* -----------------------------------------------------------------------------
   Shared MJML Head: fonts, attributes, dark mode styles, link colors
   - Keep the head consistent for a coherent brand system
----------------------------------------------------------------------------- */

const MJ_HEAD = `
  <mj-head>
    <!-- Prefer 600px layout for broad client support -->
    <mj-breakpoint width="600px" />


    <!-- Hidden preheader safety (only needed if a .preheader text block is ever used) -->
    <mj-style inline="inline">
      .preheader, .preheader * {
        display:none !important; visibility:hidden; mso-hide:all;
        font-size:1px; line-height:1px; color:#fff; max-height:0; max-width:0; opacity:0; overflow:hidden;
      }
    </mj-style>
  </mj-head>
`;

/* -----------------------------------------------------------------------------
   Preheader helpers (GrapesJS-safe)
   [Explanation], basically produce a hidden HTML snippet that sets inbox preview
----------------------------------------------------------------------------- */

/** Hidden preheader block that works in GrapesJS + major email clients */
const PREHEADER_BLOCK = (text: string) => `
  <mj-raw>
    <!-- Hidden preheader: shown in inbox snippet, hidden in email body -->
    <div
      style="
        display:none !important;
        visibility:hidden;
        mso-hide:all;
        font-size:1px;
        line-height:1px;
        color:#fff;
        max-height:0;
        max-width:0;
        opacity:0;
        overflow:hidden;
      "
    >
      ${text.replace(/\n/g, " ").slice(0, 140)}
    </div>
  </mj-raw>
`;

/** Optional: keep for non-editor builds only (don’t use inside GrapesJS) */
const MJ_PREVIEW_TAG = (text: string) => `<mj-preview>${text.replace(/\n/g, " ").slice(0, 120)}</mj-preview>`;

/* -----------------------------------------------------------------------------
   1) Magic Link Authentication
----------------------------------------------------------------------------- */

const MAGIC_LINK: StarterTemplate = {
  id: "magic-link-auth",
  name: "Magic Link Authentication",
  category: "authentication",
  subject: "Your secure sign-in link is ready",
  description:
    "Clean, branded magic-link email with strong security note, large CTA, and copy-paste fallback.",
  variables: [
    { name: "name", description: "Recipient name", example: "Alex" },
    {
      name: "magicLinkUrl",
      description: "Unique sign-in URL",
      example: "https://app.example.com/magic/abc123",
      required: true,
    },
    {
      name: "supportEmail",
      description: "Support contact email",
      example: "support@example.com",
      required: true,
    },
    {
      name: "companyAddress",
      description: "Physical mailing address for compliance",
      example: "123 Business St, City, State 12345",
      required: true,
    },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["auth", "login", "security"],
  text: `Hi {{name}},

Use the button or the URL below to securely sign in:

{{magicLinkUrl}}

For your security, this link expires soon. If you didn’t request it, please ignore this email or contact support at {{supportEmail}}.

—
This email was sent by AgenitiX.
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("Use your secure sign-in link. Expires soon for your protection.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Sign in securely</mj-text>
        <mj-text css-class="h1 text">Hi {{name}}, your sign-in link is ready.</mj-text>
        <mj-text css-class="text">Click the button below to continue. For your security, this link expires shortly.</mj-text>

        <mj-button css-class="button" href="{{magicLinkUrl}}" align="left">
          Continue to your account
        </mj-button>

        <mj-text css-class="small muted" padding-top="16px">
          Or copy and paste this URL into your browser:<br />
          <span style="word-break: break-all;"><a href="{{magicLinkUrl}}">{{magicLinkUrl}}</a></span>
        </mj-text>

        <mj-divider css-class="divider" border-color="#E5E7EB" padding="24px 0" />

        <mj-text css-class="small muted">
          Didn’t request this? You can safely ignore this message or contact us at
          <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          AgenitiX • {{companyAddress}}<br />
          <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   2) One-Time Code (OTP)
----------------------------------------------------------------------------- */

const OTP_CODE: StarterTemplate = {
  id: "otp-code",
  name: "Verification Code",
  category: "verification",
  subject: "Your verification code: {{code}}",
  description:
    "Prominent mono-spaced code block with high contrast and clear expiry note.",
  variables: [
    { name: "code", description: "6–8 digit or alphanumeric code", example: "816392", required: true },
    { name: "expiresIn", description: "Expiry duration (human)", example: "10 minutes", required: true },
    { name: "supportEmail", description: "Support email", example: "support@example.com", required: true },
    { name: "companyAddress", description: "Physical address", example: "123 Business St, City, State" },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["verification", "security", "code"],
  text: `Your verification code is: {{code}}

It expires in {{expiresIn}}. If you didn’t request a code, please ignore this email or contact {{supportEmail}}.

—
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("Use your verification code to continue. Expires soon.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Security verification</mj-text>
        <mj-text css-class="h1 text">Enter this code to continue</mj-text>

        <mj-section background-color="#F9FAFB" border-radius="12px" padding="8px 12px" text-align="center">
          <mj-column>
            <mj-text font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="28px" font-weight="800" letter-spacing="6px">
              {{code}}
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-text css-class="small muted" padding-top="12px">
          This code expires in {{expiresIn}}.
        </mj-text>

        <mj-divider css-class="divider" border-color="#E5E7EB" padding="24px 0" />

        <mj-text css-class="small muted">
          Didn’t request this? Contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          {{companyAddress}} • <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   3) Welcome / Activation
----------------------------------------------------------------------------- */

const WELCOME_ACTIVATION: StarterTemplate = {
  id: "welcome-activation",
  name: "Welcome & Activation",
  category: "welcome",
  subject: "🎉 Welcome aboard — you’re ready to go",
  description:
    "Warm welcome with next steps and resource links, clean layout and hierarchy.",
  variables: [
    { name: "name", description: "Recipient name", example: "Alex" },
    { name: "dashboardUrl", description: "Dashboard URL", example: "https://app.example.com/dashboard", required: true },
    { name: "docsUrl", description: "Docs URL", example: "https://docs.example.com", required: true },
    { name: "supportUrl", description: "Support portal URL", example: "https://support.example.com", required: true },
    { name: "companyAddress", description: "Physical address", example: "123 Business St, City, State 12345" },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["welcome", "onboarding", "resources"],
  text: `Hi {{name}},

Your account is ready. Start here:
Dashboard: {{dashboardUrl}}
Docs: {{docsUrl}}
Support: {{supportUrl}}

—
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("You’re all set. Here are your next steps and helpful links.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Welcome</mj-text>
        <mj-text css-class="h1 text">Great to have you, {{name}}!</mj-text>
        <mj-text css-class="text">Your account is ready. Jump into your dashboard or review the docs to finish setup.</mj-text>

        <mj-button css-class="button" href="{{dashboardUrl}}" align="left">
          Open Dashboard
        </mj-button>

        <mj-text css-class="small" padding-top="12px">
          Need help? Visit our <a href="{{docsUrl}}">documentation</a> or <a href="{{supportUrl}}">support center</a>.
        </mj-text>

        <mj-divider css-class="divider" border-color="#E5E7EB" padding="24px 0" />

        <mj-text css-class="h2">What’s next</mj-text>
        <mj-text css-class="small">
          • Add your team and set roles<br/>
          • Connect integrations<br/>
          • Configure notifications
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          {{companyAddress}} • <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   4) Team Invitation
----------------------------------------------------------------------------- */

const TEAM_INVITE: StarterTemplate = {
  id: "team-invite",
  name: "Team Invitation",
  category: "invitation",
  subject: "{{invitedBy}} invited you to join {{teamName}}",
  description:
    "Clear CTA, identity information, and copy-link fallback. High-contrast and minimal.",
  variables: [
    { name: "recipientName", description: "Recipient name", example: "Sam" },
    { name: "invitedBy", description: "Inviter name", example: "Jamie", required: true },
    { name: "invitedByEmail", description: "Inviter email", example: "jamie@example.com", required: true },
    { name: "teamName", description: "Team name", example: "Core Team", required: true },
    { name: "inviteUrl", description: "Invite acceptance URL", example: "https://app.example.com/invite/xyz", required: true },
    { name: "companyAddress", description: "Physical address", example: "123 Business St, City, State" },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["invitation", "collaboration"],
  text: `Hi {{recipientName}},

{{invitedBy}} ({{invitedByEmail}}) invited you to join {{teamName}}.

Accept: {{inviteUrl}}

—
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("Join {{teamName}} to collaborate with your team.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Team invitation</mj-text>
        <mj-text css-class="h1 text">You’ve been invited to {{teamName}}</mj-text>
        <mj-text css-class="text">
          Hi {{recipientName}}, <strong>{{invitedBy}}</strong>
          (<a href="mailto:{{invitedByEmail}}">{{invitedByEmail}}</a>) invited you to join the team.
        </mj-text>

        <mj-button css-class="button" href="{{inviteUrl}}" align="left">
          Accept invitation
        </mj-button>

        <mj-text css-class="small muted" padding-top="12px">
          Or copy this URL:<br />
          <span style="word-break: break-all;"><a href="{{inviteUrl}}">{{inviteUrl}}</a></span>
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          {{companyAddress}} • <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   5) Minimal Receipt
----------------------------------------------------------------------------- */

const RECEIPT: StarterTemplate = {
  id: "minimal-receipt",
  name: "Payment Receipt",
  category: "transactional",
  subject: "Receipt for {{amount}} — {{productName}}",
  description:
    "Clean transactional layout with clear totals, billing info, and support path.",
  variables: [
    { name: "customerName", description: "Customer name", example: "Alex" },
    { name: "productName", description: "Product or plan", example: "Pro Plan", required: true },
    { name: "amount", description: "Total amount with currency", example: "$29.00", required: true },
    { name: "invoiceNumber", description: "Invoice ID or number", example: "INV-10294", required: true },
    { name: "date", description: "Invoice date", example: "Aug 13, 2025", required: true },
    { name: "billingEmail", description: "Billing email", example: "billing@example.com", required: true },
    { name: "supportUrl", description: "Support link", example: "https://support.example.com" },
    { name: "companyAddress", description: "Physical address", example: "123 Business St, City, State" },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["receipt", "invoice", "payment"],
  text: `Hi {{customerName}},

Thanks for your purchase.

Product: {{productName}}
Total: {{amount}}
Invoice: {{invoiceNumber}}
Date: {{date}}

A copy has been sent to {{billingEmail}}.
Help: {{supportUrl}}

—
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("Your receipt for {{productName}} — total {{amount}}.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Payment receipt</mj-text>
        <mj-text css-class="h1 text">Thanks, {{customerName}}!</mj-text>
        <mj-text css-class="text">Here’s a summary of your purchase.</mj-text>

        <mj-divider css-class="divider" border-color="#E5E7EB" padding="16px 0" />

        <mj-table>
          <tr>
            <td style="padding:8px 0;"><strong>Product</strong></td>
            <td style="padding:8px 0;" align="right">{{productName}}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Invoice</strong></td>
            <td style="padding:8px 0;" align="right">{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Date</strong></td>
            <td style="padding:8px 0;" align="right">{{date}}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;"><strong>Total</strong></td>
            <td style="padding:8px 0;" align="right"><strong>{{amount}}</strong></td>
          </tr>
        </mj-table>

        <mj-text css-class="small muted" padding-top="16px">
          A copy has been sent to {{billingEmail}}. Need help? Visit <a href="{{supportUrl}}">{{supportUrl}}</a>.
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          {{companyAddress}} • <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   6) Password Reset
----------------------------------------------------------------------------- */

const PASSWORD_RESET: StarterTemplate = {
  id: "password-reset",
  name: "Password Reset",
  category: "account",
  subject: "Reset your password",
  description:
    "Single primary action with clear expiry and safety messaging. Copy-link fallback included.",
  variables: [
    { name: "name", description: "Recipient name", example: "Alex" },
    { name: "resetUrl", description: "Password reset URL", example: "https://app.example.com/reset/abc", required: true },
    { name: "expiresIn", description: "Expiry window", example: "60 minutes", required: true },
    { name: "supportEmail", description: "Support email", example: "support@example.com", required: true },
    { name: "companyAddress", description: "Physical address", example: "123 Business St, City, State" },
    { name: "unsubscribeUrl", description: "Unsubscribe URL", example: "https://example.com/unsub" },
  ],
  tags: ["password", "security", "account"],
  text: `Hi {{name}},

Use the link below to reset your password. It expires in {{expiresIn}}.

{{resetUrl}}

If you didn’t request this, ignore this email or contact {{supportEmail}}.

—
{{companyAddress}}
Unsubscribe: {{unsubscribeUrl}}
`,
  mjml: `
<mjml>
  ${MJ_HEAD}
  <mj-body background-color="#F3F4F6" css-class="bg-page">
    ${PREHEADER_BLOCK("Use this link to reset your password. Expires in {{expiresIn}}.")}
    <mj-section padding-top="32px" padding-bottom="0">
      <mj-column>
        <!-- AgenitiX Logo -->
        <mj-image src="/logo-mark.png" alt="AgenitiX" align="center" padding="16px 0 0" width="48px" border-radius="24px" />
      </mj-column>
    </mj-section>

    <mj-section padding="24px">
      <mj-column css-class="card card">
        <mj-text css-class="eyebrow">Account security</mj-text>
        <mj-text css-class="h1 text">Reset your password</mj-text>
        <mj-text css-class="text">Hi {{name}}, click the button below to create a new password.</mj-text>

        <mj-button css-class="button" href="{{resetUrl}}" align="left">
          Reset password
        </mj-button>

        <mj-text css-class="small muted" padding-top="12px">
          This link expires in {{expiresIn}}. Didn’t request this? Contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
        </mj-text>

        <mj-text css-class="small muted" padding-top="8px">
          Or paste this URL into your browser:<br />
          <span style="word-break: break-all;"><a href="{{resetUrl}}">{{resetUrl}}</a></span>
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 24px 32px">
      <mj-column>
        <mj-text css-class="small muted" align="center">
          {{companyAddress}} • <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
};

/* -----------------------------------------------------------------------------
   Export: Template catalog
----------------------------------------------------------------------------- */

export const STARTER_TEMPLATES_GRAPES: StarterTemplate[] = [
  MAGIC_LINK,
  OTP_CODE,
  WELCOME_ACTIVATION,
  TEAM_INVITE,
  RECEIPT,
  PASSWORD_RESET,
];

/* -----------------------------------------------------------------------------
   Helper: Build GrapesJS block specs from templates
   - category: shows in the left block panel grouping
   - content: MJML that grapesjs-mjml can render/edit
----------------------------------------------------------------------------- */

export interface GrapesBlock {
  id: string;
  label: string;
  category: string;
  content: string;
  attributes?: Record<string, string>;
  media?: string; // preview icon/url
}

export const toGrapesBlocks = (
  templates: StarterTemplate[] = STARTER_TEMPLATES_GRAPES
): GrapesBlock[] =>
  templates.map((t) => ({
    id: `block-${t.id}`,
    label: t.name,
    category: `Email / ${t.category}`,
    content: t.mjml,
    attributes: { title: t.description },
    media: t.previewImage,
  }));

/* -----------------------------------------------------------------------------
   Optional: simple search helpers (name, subject, description, tags)
----------------------------------------------------------------------------- */

export const searchTemplates = (q: string): StarterTemplate[] => {
  const s = q.toLowerCase();
  return STARTER_TEMPLATES_GRAPES.filter((t) =>
    [
      t.name,
      t.subject,
      t.description,
      ...(t.tags ?? []),
      ...t.variables.map((v) => v.name),
    ]
      .join(" ")
      .toLowerCase()
      .includes(s)
  );
};

export const getTemplateById = (id: string): StarterTemplate | undefined =>
  STARTER_TEMPLATES_GRAPES.find((t) => t.id === id);
