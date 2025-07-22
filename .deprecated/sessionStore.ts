"use client";
import { create } from "zustand";

interface SessionStore {
	session: any;
	setSession: (session: any) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
	session: null,
	setSession: (session: any) => set({ session }),
}));
