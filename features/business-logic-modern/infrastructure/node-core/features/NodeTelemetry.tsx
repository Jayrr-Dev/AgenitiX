/**
 * NODE TELEMETRY - Telemetry collection for node lifecycle events
 *
 * • Tracks node creation, execution, and performance metrics
 * • Integrates with TelemetryClient for data collection
 * • Lightweight component with minimal performance impact
 * • Privacy-conscious data collection
 *
 * Keywords: telemetry, analytics, node-lifecycle, performance-tracking
 */

import type React from "react";
import { useEffect } from "react";
import { TelemetryClient } from "../../telemetry/TelemetryClient";

interface NodeTelemetryProps {
	nodeId: string;
	nodeKind: string;
}

const NodeTelemetry: React.FC<NodeTelemetryProps> = ({ nodeId, nodeKind }) => {
	useEffect(() => {
		TelemetryClient.send("node_created", {
			nodeId,
			nodeKind,
			timestamp: Date.now(),
		});
	}, [nodeId, nodeKind]); // Include dependencies for telemetry tracking

	return null;
};

export default NodeTelemetry;
