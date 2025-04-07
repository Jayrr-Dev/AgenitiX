// stores/userStore.
"use client"

import { create } from "zustand";

interface UserStore {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),
}));