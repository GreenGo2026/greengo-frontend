import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;  // called with final transcript
  className?:   string;                  // extra classes: offsets, sizing -- never position itself, see `overlay`
  variant?:     "dark" | "light";        // color scheme; "dark" = HomePage's dark catalog bar (default)
  overlay?:     boolean;                 // true = absolutely positioned over an input (HomePage-style bar);
                                          // false = normal flex child (GlobalSearchBar-style bar). Default false.
}

// Maps GreenGo's language codes to BCP-47 speech recognition locales.
const LANG_MAP: Record<string, string> = {
  ar: "ar-MA",   // Arabic → Moroccan Arabic variant (best Darija coverage)
  fr: "fr-FR",
  en: "en-US",
};

// "blocked" replaces the old "denied" -- it's visible (grey MicOff, strike-
// through) and tapping it retries start(), instead of the button
// disappearing forever after one rejected permission prompt.
type VoiceState = "idle" | "listening" | "error" | "blocked";

// Component chooses its own position class (relative/absolute) based on
// `overlay` rather than expecting callers to pass it via `className` --
// having both `relative` and `absolute` present on one element is fragile
// (Tailwind resolves the conflict by generated-stylesheet order, not by
// the order classes appear in the string), and the pulse-ring child below
// needs the button itself to be the positioning context, not whatever
// ancestor happens to be non-static.
const COLORS: Record<"dark" | "light", Record<VoiceState, string>> = {
  dark: {
    idle:      "text-gray-400 hover:text-gray-200",
    listening: "text-emerald-400",
    error:     "text-red-400",
    blocked:   "text-gray-600",
  },
  light: {
    idle:      "text-gray-400 hover:text-[#0c3228]",
    listening: "text-emerald-500",
    error:     "text-red-500",
    blocked:   "text-gray-300",
  },
};

interface ErrorInfo {
  message: string;
  code:    string;
}

// Every SpeechRecognitionErrorEvent.error code this app has actually seen
// or expects, mapped to the resulting UI state + user-facing message.
// no-speech/aborted intentionally produce no message -- those are normal,
// frequent, and not worth interrupting the user over.
function classifyError(code: string, ar: boolean): { state: VoiceState; info: ErrorInfo | null } {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        state: "blocked",
        info: {
          message: ar
            ? "الميكروفون محظور — فعّله من إعدادات المتصفح"
            : "Micro bloqué — autorisez-le dans les paramètres du navigateur",
          code,
        },
      };
    case "audio-capture":
      return {
        state: "blocked",
        info: {
          message: ar ? "لم يتم العثور على ميكروفون" : "Aucun micro détecté",
          code,
        },
      };
    case "network":
      return {
        state: "error",
        info: {
          message: ar ? "يتطلب اتصال بالإنترنت" : "Connexion requise",
          code,
        },
      };
    case "no-speech":
    case "aborted":
      return { state: "idle", info: null };
    default:
      return {
        state: "error",
        info: { message: ar ? "خطأ في البحث الصوتي" : "Erreur de recherche vocale", code },
      };
  }
}

export default function VoiceSearchButton({ onTranscript, className, variant = "dark", overlay = false }: VoiceSearchButtonProps) {
  const { language } = useLanguage();
  const [state, setState] = useState<VoiceState>("idle");
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const isAr = language === "ar";

  function showBubble(info: ErrorInfo): void {
    setErrorInfo(info);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setErrorInfo(null), 4000);
  }

  function clearRecognizer(): void {
    const r = recogRef.current;
    if (!r) return;
    r.onresult = null;
    r.onerror = null;
    r.onend = null;
    r.onspeechend = null;
    r.abort();
    recogRef.current = null;
  }

  function startListening(): void {
    if (state === "listening") {
      // Second tap = cancel
      clearRecognizer();
      setState("idle");
      return;
    }
    if (!Recog) return;

    // Defensive -- abort any lingering session before starting a new one
    // (e.g. a stale ref from a fast double-tap or an unexpected onend miss).
    clearRecognizer();

    const r = new Recog();
    r.lang            = LANG_MAP[language] ?? "ar-MA";
    r.continuous      = false;
    // Interim results would flicker the search and filter the catalog
    // mid-speech -- final-only means the value replaces cleanly, once.
    r.interimResults  = false;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) onTranscript(transcript);
    };

    r.onerror = (e) => {
      const { state: nextState, info } = classifyError(e.error, isAr);
      setState(nextState);
      if (info) showBubble(info);
      if (nextState === "error") setTimeout(() => setState("idle"), 1500);
    };

    r.onend = () => {
      // Fires after a result OR after the browser's own silence timeout.
      // Only resets from "listening" -- must never clobber "blocked"/"error"
      // if onerror already moved state elsewhere before onend fires.
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recogRef.current = r;
    try {
      r.start();
      setState("listening");
    } catch {
      // InvalidStateError -- a session was already active on this
      // recognizer instance somehow. Reset and let the user retry.
      clearRecognizer();
      setState("idle");
    }
  }

  // Cleanup on unmount -- detach handlers before aborting so no late-firing
  // callback can touch state after this component is gone.
  useEffect(() => {
    return () => {
      clearRecognizer();
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!Recog) return null;

  const Icon = state === "blocked" ? MicOff : Mic;

  return (
    <div className={(overlay ? "absolute " : "relative ") + "shrink-0 " + (className ?? "")}>
      <button
        type="button"
        onClick={startListening}
        title={state === "listening"
          ? (isAr ? "تكلم الآن…" : "Parlez maintenant…")
          : state === "blocked"
          ? (isAr ? "الميكروفون محظور — اضغط لإعادة المحاولة" : "Micro bloqué — appuyez pour réessayer")
          : (isAr ? "البحث الصوتي" : "Recherche vocale")}
        className={"relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors " +
          COLORS[variant][state]}>
        {/* Pulse ring — only while listening */}
        {state === "listening" && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
        )}
        <Icon size={16} strokeWidth={2} className="relative z-10" />
      </button>

      {/* Inline feedback bubble -- devices in the field can't be inspected
          with DevTools, so the raw error code stays visible here until
          mobile behavior is confirmed working. */}
      {errorInfo && (
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="absolute top-full z-50 mt-2 w-max max-w-[220px] rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-xl"
          style={{ insetInlineEnd: 0 }}>
          {errorInfo.message}
          <span className="mt-0.5 block text-[10px] font-normal text-white/50">({errorInfo.code})</span>
        </div>
      )}
    </div>
  );
}
