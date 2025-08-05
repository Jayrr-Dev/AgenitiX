"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConvexAuth } from "@/hooks/useConvexAuth";
import { useConvexAuth as useConvexAuthState } from "convex/react";
import { type ReactNode, createContext, useContext } from "react";

type AuthContextType = ReturnType<typeof useAuth> & ReturnType<typeof useConvexAuth> & {
	convexAuthState: ReturnType<typeof useConvexAuthState>;
	isOAuthAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const auth = useAuth();
	const convexAuth = useConvexAuth();
	const convexAuthState = useConvexAuthState();
	
	// Check if user is authenticated via OAuth, basically modern authentication using Convex Auth
	const isOAuthAuthenticated = convexAuthState.isAuthenticated;

	const combinedAuth = {
		...auth,
		...convexAuth,
		convexAuthState,
		isOAuthAuthenticated,
		// Override isAuthenticated to check both auth methods
		isAuthenticated: auth.isAuthenticated || isOAuthAuthenticated,
	};

	return <AuthContext.Provider value={combinedAuth}>{children}</AuthContext.Provider>;
};
