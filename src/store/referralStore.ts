// src/store/referralStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ReferralState {
  code: string | null;
  referrerName: string | null;
  setReferral: (code: string, referrerName: string) => void;
  clear: () => void;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set) => ({
      code: null,
      referrerName: null,
      setReferral: (code, referrerName) => set({ code, referrerName }),
      clear: () => set({ code: null, referrerName: null }),
    }),
    {
      name: "greengo-referral",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
