import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { logVoiceEvent, isVoiceDebugEnabled } from "../utils/voiceDebugLog";
import VoiceDebugPanel from "./VoiceDebugPanel";

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;   // called once with the final (or best-effort) transcript
  onInterim?:   (text: string) => void;   // called repeatedly while listening -- visible-only, never submits
  className?:   string;                   // extra classes: offsets, sizing -- never position itself, see `overlay`
  variant?:     "dark" | "light";         // color scheme; "dark" = HomePage's dark catalog bar (default)
  overlay?:     boolean;                  // true = absolutely positioned over an input (HomePage-style bar);
                                           // false = normal flex child (GlobalSearchBar-style bar). Default false.
}

// Recognition language is independent of the UI language (point D) -- most
// customers speak Darija regardless of which UI language they browse in.
// Cycle order: دارجة (ar-MA) -> FR -> EN -> back to دارجة.
const VOICE_LANGS = ["ar-MA", "fr-FR", "en-US"] as const;
type VoiceLang = (typeof VOICE_LANGS)[number];
const VOICE_LANG_LABELS: Record<VoiceLang, string> = { "ar-MA": "دارجة", "fr-FR": "FR", "en-US": "EN" };

// UI language -> default voice language, used only when no localStorage
// preference exists yet. UI=EN defaults to ar-MA, not en-US -- an English
// UI setting doesn't mean the customer speaks English into the mic.
const UI_TO_DEFAULT_VOICE_LANG: Record<string, VoiceLang> = { ar: "ar-MA", fr: "fr-FR", en: "ar-MA" };

// If the requested recognition language isn't available on this browser
// build, retry once with a close variant before giving up.
const FALLBACK_LANG: Partial<Record<VoiceLang | string, string>> = {
  "ar-MA": "ar-SA",
  "fr-FR": "fr",
};

const VOICE_LANG_STORAGE_KEY = "gg_voice_lang";

// "blocked" is visible (grey MicOff, strike-through) and tapping it retries
// start() -- the button never disappears forever after one rejected prompt.
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

// Every SpeechRecognitionErrorEvent.error code this app maps explicitly.
// aborted stays silent -- it comes from a user-initiated cancel (second
// tap), not a failure worth interrupting them over. no-speech now DOES
// show a message (previously silent, which looked identical to "nothing
// captured" when it was actually a wrong-input-device problem).
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
        info: { message: ar ? "لم يتم العثور على ميكروفون" : "Aucun micro détecté", code },
      };
    case "no-speech":
      return {
        state: "idle",
        info: {
          message: ar
            ? "لم يُسمع أي صوت — تحقق من الميكروفون"
            : "Aucun son détecté — vérifiez le micro",
          code,
        },
      };
    case "network":
      return {
        state: "error",
        info: { message: ar ? "يتطلب اتصال بالإنترنت" : "Connexion requise", code },
      };
    case "aborted":
      return { state: "idle", info: null };
    default:
      return {
        state: "error",
        info: { message: ar ? "خطأ في البحث الصوتي" : "Erreur de recherche vocale", code },
      };
  }
}

// VoiceSearchButton is mounted up to 3x on one page (HomePage's catalog bar,
// GlobalSearchBar desktop + mobile). Without this, ?debug=voice would stack
// 3 identical panels at the bottom of the screen. Only the first mounted
// instance claims the panel; releases the claim on unmount so a later
// instance (e.g. after route change) can pick it up.
let panelClaimed = false;

function readStoredVoiceLang(uiLanguage: string): VoiceLang {
  try {
    const stored = localStorage.getItem(VOICE_LANG_STORAGE_KEY);
    if (stored && (VOICE_LANGS as readonly string[]).includes(stored)) return stored as VoiceLang;
  } catch { /* storage blocked -- fall through to default */ }
  return UI_TO_DEFAULT_VOICE_LANG[uiLanguage] ?? "ar-MA";
}

export default function VoiceSearchButton({ onTranscript, onInterim, className, variant = "dark", overlay = false }: VoiceSearchButtonProps) {
  const { language, isRTL } = useLanguage();
  const [state, setState] = useState<VoiceState>("idle");
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>(() => readStoredVoiceLang(language));

  const recogRef            = useRef<SpeechRecognition | null>(null);
  const bubbleTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimTranscriptRef = useRef("");
  const submittedRef         = useRef(false);
  const retriedRef           = useRef(false);

  const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const isAr = language === "ar";
  const debugOn = isVoiceDebugEnabled();
  const [ownsPanel] = useState(() => {
    if (!debugOn || panelClaimed) return false;
    panelClaimed = true;
    return true;
  });

  useEffect(() => {
    if (debugOn) {
      const ctor = window.SpeechRecognition ? "SpeechRecognition" : window.webkitSpeechRecognition ? "webkitSpeechRecognition" : "none";
      logVoiceEvent("env", `constructor=${ctor} UA=${navigator.userAgent}`);
    }
    return () => {
      if (ownsPanel) panelClaimed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function beginRecognition(lang: string, isRetry: boolean): void {
    if (!Recog) return;
    clearRecognizer();
    interimTranscriptRef.current = "";
    submittedRef.current = false;
    if (!isRetry) retriedRef.current = false;

    const r = new Recog();
    r.lang            = lang;
    r.continuous      = false;
    // Interim results ARE now used (point A) -- Chrome/Android sometimes
    // ends a session with only interim text and no final result, which
    // previously meant the transcript was silently lost.
    r.interimResults  = true;
    r.maxAlternatives = 3;

    r.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        let alt = "";
        for (let j = 0; j < result.length; j++) {
          const t = result[j]?.transcript?.trim();
          if (t) { alt = t; break; }
        }
        if (!alt) continue;
        if (result.isFinal) {
          submittedRef.current = true;
          if (debugOn) logVoiceEvent("onresult", `final="${alt}"`);
          onTranscript(alt);
        } else {
          interimText = alt;
        }
      }
      if (interimText) {
        interimTranscriptRef.current = interimText;
        if (debugOn) logVoiceEvent("onresult", `interim="${interimText}"`);
        onInterim?.(interimText);
      }
    };

    r.onerror = (e) => {
      if (debugOn) logVoiceEvent("onerror", `code=${e.error}`);

      if (e.error === "language-not-supported" && !retriedRef.current) {
        const fallback = FALLBACK_LANG[lang];
        if (fallback) {
          retriedRef.current = true;
          if (debugOn) logVoiceEvent("retrying with fallback language", fallback);
          beginRecognition(fallback, true);
          return;
        }
      }

      const { state: nextState, info } = classifyError(e.error, isAr);
      setState(nextState);
      if (info) showBubble(info);
      if (nextState === "error") setTimeout(() => setState("idle"), 1500);
    };

    r.onend = () => {
      if (debugOn) logVoiceEvent("onend", `hadFinal=${submittedRef.current} interim="${interimTranscriptRef.current}"`);
      // Chrome (mobile especially) sometimes ends a session with only
      // interim results and no final one -- recover by submitting the
      // last interim text rather than losing the utterance entirely.
      if (!submittedRef.current && interimTranscriptRef.current) {
        if (debugOn) logVoiceEvent("ended with no final result — submitting interim", interimTranscriptRef.current);
        submittedRef.current = true;
        onTranscript(interimTranscriptRef.current);
      }
      // Only resets from "listening" -- must never clobber "blocked"/"error"
      // if onerror already moved state elsewhere before onend fires.
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recogRef.current = r;
    try {
      if (debugOn) logVoiceEvent("start() called", `lang=${lang}`);
      r.start();
      setState("listening");
    } catch (err) {
      // InvalidStateError -- a session was already active on this
      // recognizer instance somehow. Reset and let the user retry.
      if (debugOn) logVoiceEvent("start() threw", String(err));
      clearRecognizer();
      setState("idle");
    }
  }

  function startListening(): void {
    if (state === "listening") {
      // Second tap = cancel
      clearRecognizer();
      setState("idle");
      return;
    }
    if (!Recog) return;
    beginRecognition(voiceLang, false);
  }

  function cycleVoiceLang(e: React.MouseEvent): void {
    e.stopPropagation();
    const idx = VOICE_LANGS.indexOf(voiceLang);
    const next = VOICE_LANGS[(idx + 1) % VOICE_LANGS.length];
    setVoiceLang(next);
    try { localStorage.setItem(VOICE_LANG_STORAGE_KEY, next); } catch { /* storage blocked -- in-memory only */ }
    if (state === "listening") beginRecognition(next, false);
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

      {/* Voice-language chip — recognition language, independent of UI
          language; shown only while listening, cycles on tap. */}
      {state === "listening" && (
        <button
          type="button"
          onClick={cycleVoiceLang}
          title={isAr ? "لغة البحث الصوتي" : "Langue de reconnaissance vocale"}
          className={"absolute -top-1.5 z-20 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow " +
            (isRTL ? "-left-1.5" : "-right-1.5")}>
          {VOICE_LANG_LABELS[voiceLang]}
        </button>
      )}

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

      {ownsPanel && <VoiceDebugPanel />}
    </div>
  );
}
