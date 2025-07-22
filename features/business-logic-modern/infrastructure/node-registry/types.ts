/**
 * Type definitions for the Modern Node Registry.
 */

import type { NodeSpecMetadata } from "./nodespec-registry";

/**
 * Legacy alias – during migration NodeMetadata == NodeSpecMetadata.
 * Keep filename to avoid massive import churn; eventually delete this file.
 */
export type NodeMetadata = NodeSpecMetadata;
