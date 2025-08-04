/**
 * FLOW EDITOR PAGE - Individual flow editing interface
 *
 * • Loads flow data from Convex database
 * • Renders the FlowEditor component for visual editing
 * • Handles flow not found scenarios
 * • Full-screen editor interface
 * • Real-time flow data integration
 *
 * Keywords: flow-editor, convex, database, visual-editor, full-screen
 */

"use client";

import { Loading } from "@/components/Loading";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { PieMenuProvider } from "@/components/ui/pie-menu";
import { api } from "@/convex/_generated/api";
import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";
import { FlowMetadataProvider } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
import { useLoadCanvas } from "@/features/business-logic-modern/infrastructure/flow-engine/hooks/useLoadCanvas";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

// TYPES
type PageProps = {
  params: Promise<{
    flowId: string;
  }>;
};

/**
 * Client component that loads a Flow by ID from Convex database.
 * @param params - Contains the flowId from the URL
 */
export default function FlowPage({ params }: PageProps) {
  const { flowId } = use(params);
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

  // Fetch flow data from Convex with proper access control
  const flow = useQuery(
    api.flows.getFlowSecure,
    flowId && user?.id
      ? {
          flow_id: flowId as Id<"flows">,
          user_id: user.id,
        }
      : "skip"
  );

  // Loading states
  if (authLoading || flow === undefined) {
    return (
      <Loading
        className="min-h-screen bg-background"
        size="w-12 h-12"
        text="Loading flow..."
        textSize="text-base"
      />
    );
  }

  // Authentication check
  if (!(isAuthenticated && user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-bold text-2xl text-foreground">
            Authentication Required
          </h2>
          <p className="mb-6 text-muted-foreground">
            Please sign in to access this flow
          </p>
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Flow not found or access denied
  if (flow === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-bold text-2xl text-foreground">
            Access Denied
          </h2>
          <p className="mb-6 text-muted-foreground">
            The flow you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                My Flows
              </Button>
            </Link>
            <Link href="/explore">
              <Button className="gap-2">Explore Public Flows</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render the full-screen flow editor with metadata context
  return (
    <div
      className="h-[100vh] w-[100vw]"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <FlowMetadataProvider
        flow={{
          id: flowId,
          name: flow.name,
          description: flow.description,
          is_private: flow.is_private,
          isOwner: flow.isOwner,
          canEdit: flow.canEdit,
          userPermission: flow.userPermission as
            | "view"
            | "edit"
            | "admin"
            | undefined,
        }}
      >
        <FlowEditorWithCanvasLoading />
      </FlowMetadataProvider>
    </div>
  );
}

/**
 * Component that handles canvas loading state to prevent double loading screens
 */
function FlowEditorWithCanvasLoading() {
  const canvasLoader = useLoadCanvas();

  // Show single unified loading while canvas loads
  if (canvasLoader.isLoading) {
    return (
      <Loading
        className="min-h-screen bg-background"
        size="w-12 h-12"
        text="Loading editor..."
        textSize="text-base"
      />
    );
  }

  // Show canvas loading error if it failed
  if (canvasLoader.error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h2 className="mb-2 font-bold text-2xl text-foreground">
            Loading Error
          </h2>
          <p className="mb-6 text-muted-foreground">{canvasLoader.error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Canvas loaded successfully, render the editor with pie menu provider
  return (
    <PieMenuProvider>
      <FlowEditor />
    </PieMenuProvider>
  );
}
