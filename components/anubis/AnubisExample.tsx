'use client';

import React from 'react';
import { useAnubis } from './AnubisProvider';
import { useAnubisProtection, ProtectedComponent, AnubisUtils } from '@/hooks/useAnubisProtection';
import { CustomLogo } from '@/branding/custom-logo';

// EXAMPLE COMPONENT SHOWING AGENITIX PROTECTION USAGE
export function AnubisExample() {
  const { isEnabled, toggleProtection } = useAnubis();
  const { isProtected, protectCurrentRoute, unprotectCurrentRoute } = useAnubisProtection({
    autoProtect: false // Don't auto-protect this example page
  });

  // PROTECT ADMIN ROUTES EXAMPLE
  const protectAdminRoutes = () => {
    AnubisUtils.protectRoutes(AnubisUtils.patterns.admin, toggleProtection);
  };

  // PROTECT E-COMMERCE ROUTES EXAMPLE
  const protectEcommerceRoutes = () => {
    AnubisUtils.protectRoutes(AnubisUtils.patterns.ecommerce, toggleProtection);
  };

  // PROTECT API ROUTES EXAMPLE
  const protectApiRoutes = () => {
    AnubisUtils.protectRoutes(AnubisUtils.patterns.api, toggleProtection);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="text-center border border-transparent bg-fill-border hover:animate-fill-transparency rounded-xl p-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CustomLogo size={48} />
          <h1 className="text-3xl font-brand text-foreground">AgenitiX Protection</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced protection system that verifies legitimate users and blocks automated traffic. 
          Secure your routes with intelligent verification mechanisms.
        </p>
      </div>

      {/* STATUS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-secondary shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-muted'}`}></div>
            <h3 className="font-ui font-semibold text-foreground">System Status</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEnabled ? '🛡️ Protection Active' : '🔓 Protection Disabled'}
          </p>
        </div>

        <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isProtected ? 'bg-secondary shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-yellow-400'}`}></div>
            <h3 className="font-ui font-semibold text-foreground">Current Route</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {isProtected ? '🛡️ Protected' : '🔓 Unprotected'}
          </p>
        </div>

        <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_6px_rgba(34,197,94,0.8)]"></div>
            <h3 className="font-ui font-semibold text-foreground">Verification Type</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            🔐 Browser Verification
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-xl p-6">
        <h2 className="text-xl font-ui font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={protectCurrentRoute}
            disabled={isProtected}
            className={`p-4 rounded-lg text-left transition-all duration-300 border border-transparent ${
              isProtected 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-fill-border hover:animate-fill-transparency text-foreground'
            }`}
          >
            <div className="font-medium">🛡️ Protect Current Route</div>
            <div className="text-sm text-muted-foreground mt-1">
              Enable protection for this page
            </div>
          </button>

          <button
            onClick={unprotectCurrentRoute}
            disabled={!isProtected}
            className={`p-4 rounded-lg text-left transition-all duration-300 border border-transparent ${
              !isProtected 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-fill-border hover:animate-fill-transparency text-foreground'
            }`}
          >
            <div className="font-medium">🔓 Unprotect Current Route</div>
            <div className="text-sm text-muted-foreground mt-1">
              Disable protection for this page
            </div>
          </button>
        </div>
      </div>

      {/* BULK PROTECTION */}
      <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-xl p-6">
        <h2 className="text-xl font-ui font-semibold text-foreground mb-4">Bulk Protection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={protectAdminRoutes}
            className="p-4 rounded-lg text-left transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency text-foreground"
          >
            <div className="font-medium">🔐 Admin Routes</div>
            <div className="text-sm text-muted-foreground mt-1">
              /admin, /dashboard, /settings
            </div>
          </button>

          <button
            onClick={protectEcommerceRoutes}
            className="p-4 rounded-lg text-left transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency text-foreground"
          >
            <div className="font-medium">🛒 E-commerce Routes</div>
            <div className="text-sm text-muted-foreground mt-1">
              /checkout, /payment, /account
            </div>
          </button>

          <button
            onClick={protectApiRoutes}
            className="p-4 rounded-lg text-left transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency text-foreground"
          >
            <div className="font-medium">🔌 API Routes</div>
            <div className="text-sm text-muted-foreground mt-1">
              /api/*, /graphql, /webhook
            </div>
          </button>
        </div>
      </div>

      {/* PROTECTED COMPONENT EXAMPLE */}
      <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-xl p-6">
        <h2 className="text-xl font-ui font-semibold text-foreground mb-4">Protected Component Example</h2>
        <ProtectedComponent
          fallback={
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <p className="text-muted-foreground">🔒 This content is protected by AgenitiX</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enable protection to see the verification system in action
              </p>
            </div>
          }
        >
          <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
            <h3 className="font-medium text-secondary mb-2">🎉 Protected Content</h3>
            <p className="text-sm text-muted-foreground">
              This content is only visible when AgenitiX protection is active and the user has 
              successfully completed the verification process. This demonstrates how you can 
              protect sensitive components within your application.
            </p>
          </div>
        </ProtectedComponent>
      </div>

      {/* INTEGRATION GUIDE */}
      <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-xl p-6">
        <h2 className="text-xl font-ui font-semibold text-foreground mb-4">Integration Guide</h2>
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">1. Hook-based Protection</h3>
            <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
              useAnubisProtection(&#123; autoProtect: true &#125;)
            </code>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">2. Component Wrapping</h3>
            <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
              &lt;ProtectedComponent&gt;...&lt;/ProtectedComponent&gt;
            </code>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">3. Manual Route Protection</h3>
            <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
              toggleProtection('/sensitive-route', true)
            </code>
          </div>
        </div>
      </div>
    </div>
  );
} 