// types/flow.ts

/** A "Flow" is one of the user's saved workflows */
export interface Flow {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	private: boolean;
	createdAt: string;
	updatedAt: string;
	userId: string;
}

/** Flow creation request interface */
export interface CreateFlowRequest {
	name: string;
	description?: string;
	icon?: string;
	private: boolean;
}

/** Flow creation response interface */
export interface CreateFlowResponse {
	success: boolean;
	flow?: Flow;
	error?: string;
}

/** Flow deletion response interface */
export interface DeleteFlowResponse {
	success: boolean;
	error?: string;
}

/** Flow sharing response interface */
export interface ShareFlowResponse {
	success: boolean;
	shareUrl?: string;
	error?: string;
}
