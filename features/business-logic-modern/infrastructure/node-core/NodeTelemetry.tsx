/**
 * NODE TELEMETRY COMPONENT - Fires lifecycle events to TelemetryClient
 *
 * • Mounted automatically by withNodeScaffold for every node instance
 * • Currently sends only "node_created" event (once per mount)
 * • Future events (update, activation) can be added easily
 *
 * Keywords: telemetry, analytics, node-created, react, hooks
 */

import { useEffect } from "react";
import { TelemetryClient } from "../telemetry/TelemetryClient";

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // fire only once per mount

	return null;
};

export default NodeTelemetry;
