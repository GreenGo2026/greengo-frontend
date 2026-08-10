// src/components/ReferralCapture.tsx
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useReferralStore } from "../store/referralStore";

const API = (import.meta.env.VITE_API_URL || "").replace(/[/]+$/, "");

export default function ReferralCapture() {
  const [searchParams] = useSearchParams();
  const refParam = searchParams.get("ref");
  const setReferral = useReferralStore((s) => s.setReferral);
  const storedCode = useReferralStore((s) => s.code);

  useEffect(() => {
    if (!refParam) return;
    const code = refParam.trim().toUpperCase();
    if (!code || code === storedCode) return;

    fetch(API + "/api/v1/customers/referral/" + encodeURIComponent(code))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.valid) {
          setReferral(code, data.referrer_name || "");
        }
      })
      .catch(() => { /* ignore -- a bad/offline lookup just skips the banner */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam]);

  return null;
}
