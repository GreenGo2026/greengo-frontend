import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";
import type { CustomerProfile } from "../hooks/useCustomerAuth";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") +
  "/api/v1/customers/auth";

interface Props {
  onSuccess: (token: string, customer: CustomerProfile) => void;
  onClose: () => void;
}

/** Normalize a Moroccan phone to +212XXXXXXXXX for the API; leaves other
 *  formats alone so the backend's own validation surfaces the real error. */
function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("212")) return "+" + d;
  if (d.startsWith("0") && d.length === 10) return "+212" + d.slice(1);
  return raw;
}

export default function OTPLoginModal({ onSuccess, onClose }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleRequestOTP(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ?? "Erreur " + res.status);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(code?: string): Promise<void> {
    const value = code ?? otp.join("");
    if (value.length < 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API + "/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), otp: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ?? "Code incorrect");
      onSuccess(data.token, data.customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpKey(i: number, e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleOtpChange(i: number, val: string): void {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    const joined = next.join("");
    if (digit && joined.length === 6 && next.every((d) => d)) {
      void handleVerifyOTP(joined);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">
              {step === "phone" ? "Se connecter" : "Vérification"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {step === "phone"
                ? "Entrez votre numéro WhatsApp"
                : "Code envoyé au " + normalizePhone(phone)}
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200">
            <X size={15} />
          </button>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition-all focus-within:border-[#2E8B57]/40 focus-within:ring-2 focus-within:ring-[#2E8B57]/10">
              <div className="flex items-center border-r border-gray-200 bg-gray-100 px-3">
                <span className="text-sm font-bold text-gray-500">🇲🇦 +212</span>
              </div>
              <input
                type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleRequestOTP()}
                placeholder="06 12 34 56 78"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <button onClick={() => void handleRequestOTP()} disabled={loading || phone.length < 9}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#2E8B57]/20 transition-all hover:bg-[#1F6B40] disabled:cursor-not-allowed disabled:opacity-50">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Envoi…</>
                : <><MessageCircle size={16} /> Envoyer le code WhatsApp</>}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  className={"h-12 w-10 rounded-xl border-2 text-center text-lg font-extrabold text-gray-800 outline-none transition-all " +
                    (digit ? "border-[#2E8B57] bg-[#2E8B57]/6" : "border-gray-200 bg-gray-50 focus:border-[#2E8B57]/60")}
                />
              ))}
            </div>
            {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}
            <button onClick={() => void handleVerifyOTP()} disabled={loading || otp.join("").length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#2E8B57]/20 transition-all hover:bg-[#1F6B40] disabled:opacity-50">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Vérification…</>
                : <><CheckCircle2 size={16} /> Confirmer</>}
            </button>
            <div className="text-center">
              {countdown > 0
                ? <p className="text-xs text-gray-400">Renvoyer dans {countdown}s</p>
                : (
                  <button onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="text-xs font-semibold text-[#2E8B57] hover:underline">
                    ← Changer de numéro / Renvoyer
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
