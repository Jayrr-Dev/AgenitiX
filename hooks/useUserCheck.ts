import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to check if a user exists without triggering authentication errors
 */
export const useUserCheck = (email: string | null) => {
	const userCheck = useQuery(
		api.auth.checkUserExists,
		email ? { email } : "skip"
	);

	return {
		exists: userCheck?.exists ?? false,
		isActive: userCheck?.isActive ?? false,
		isLoading: userCheck === undefined && email !== null,
	};
};