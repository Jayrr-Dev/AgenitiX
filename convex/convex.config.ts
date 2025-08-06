/**
 * Route: convex/convex.config.ts
 * CONVEX APP CONFIGURATION - Main Convex application setup
 *
 * • Defines the main Convex application with server-side configuration
 * • Configures AI agent components for Convex integration
 * • Sets up the application for deployment and development
 *
 * Keywords: convex-config, ai-agent, server-setup
 */

import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import auth from "@convex-dev/auth/convex.config";

const app = defineApp();
app.use(agent);
app.use(auth);

export default app;