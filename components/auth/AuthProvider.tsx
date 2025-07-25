"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type AuthContextType = ReturnType<typeof useAuth>;

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

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};