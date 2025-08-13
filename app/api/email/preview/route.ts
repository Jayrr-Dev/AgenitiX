"use server";
/**
 * Route: api/email/preview/route.ts
 * EMAIL PREVIEW RENDERER – Server-side HTML rendering for React Email templates
 *
 * • Receives a template key and props; returns rendered HTML for iframe preview
 * • Exposes a GET endpoint to list available templates and default props
 * • Uses server-only rendering to keep client bundle lean and respect boundaries
 *
 * Keywords: email-preview, react-email, server-render, iframe, preheader
 */

import "server-only";
import { NextResponse } from "next/server";

// Import React Email templates from the starter folder
// TODO: Fix React Email compatibility with React 19
// import NotionMagicLinkEmail from "../../../../react-email-starter/emails/notion-magic-link";
// import PlaidVerifyIdentityEmail from "../../../../react-email-starter/emails/plaid-verify-identity";
// import VercelInviteUserEmail from "../../../../react-email-starter/emails/vercel-invite-user";

async function renderEmailHtml(element: React.ReactElement): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return "<!doctype html>" + renderToStaticMarkup(element);
}

/** Template registry on the server
 * [Explanation], basically a map of keys to components and default preview props
 */
const TEMPLATE_REGISTRY = {
  // TODO: Re-enable when React Email is compatible with React 19
  // Currently empty due to React 19 compatibility issues
} as const;

type TemplateKey = keyof typeof TEMPLATE_REGISTRY;

/**
 * GET /api/email/preview
 * Returns available templates and their default props.
 */
export async function GET() {
  // TODO: Re-enable when React Email is compatible with React 19
  const templates: any[] = [];
  return NextResponse.json({ templates });
}

/**
 * POST /api/email/preview
 * Body: { template: string; props?: Record<string, unknown>; }
 * Returns: { html: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      template?: string;
      props?: Record<string, unknown> | null;
    };

    // TODO: Re-enable when React Email is compatible with React 19
    return NextResponse.json(
      { error: "Email preview temporarily disabled due to React 19 compatibility issues" },
      { status: 503 },
    );

    /*
    const key = (body.template || "notion_magic_link") as TemplateKey;
    const entry = TEMPLATE_REGISTRY[key];
    if (!entry) {
      return NextResponse.json(
        { error: `Unknown template '${body.template}'` },
        { status: 400 },
      );
    }

    const { Component, defaultProps } = entry;
    const props = {
      ...defaultProps,
      ...(body.props ?? {}),
    } as Record<string, unknown>;

    // Render server-side to an HTML string appropriate for email clients
    const html = await renderEmailHtml(Component(props as any));

    return NextResponse.json({ html });
    */
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


