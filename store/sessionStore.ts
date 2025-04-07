import { create } from "zustand";
import { createClient } from "@/utils/supabase/server";

interface SessionStore {
  session: any;
  setSession: (session: any) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  setSession: async () => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session });
  },
}));    




