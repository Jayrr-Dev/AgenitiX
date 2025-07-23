/**
 * DEV CONSOLE SERVER ACTION
 * Logs node mount events to console to verify serverAction dispatcher.
 * In React 18 Strict-Mode this will fire twice; we de-duplicate via a Set.
 */

import { type ServerActionContext, registerServerAction } from "./serverActionRegistry";

const seen = new Set<string>();

const logAction = async (ctx: ServerActionContext) => {
	const key = `${ctx.nodeId}-mounted`;
	if (seen.has(key)) return;
	seen.add(key);
	// eslint-disable-next-line no-console
	console.log(
		`%c🛰️  [serverAction] node_created %c${ctx.nodeKind} %c(${ctx.nodeId})`,
		"color:cyan",
		"color:yellow",
		"color:white"
	);
};

registerServerAction(logAction);
