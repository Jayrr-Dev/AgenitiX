/**
 * SERVER ACTION REGISTRY - async callbacks executed on node mount.
 */

export interface ServerActionContext {
	nodeId: string;
	nodeKind: string;
	data: Record<string, unknown>;
}

export type ServerAction = (ctx: ServerActionContext) => void | Promise<void>;

const actions: ServerAction[] = [];

export const registerServerAction = (fn: ServerAction) => actions.push(fn);

export const runServerActions = async (ctx: ServerActionContext) => {
	await Promise.all(actions.map((fn) => fn(ctx)));
};
