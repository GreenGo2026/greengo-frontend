import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
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

type VoiceState = "idle" | "listening" | "error" | "denied";

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
    denied:    "",
  },
  light: {
    idle:      "text-gray-400 hover:text-[#0c3228]",
    listening: "text-emerald-500",
    error:     "text-red-500",
    denied:    "",
  },
};

export default function VoiceSearchButton({ onTranscript, className, variant = "dark", overlay = false }: VoiceSearchButtonProps) {
  const { language } = useLanguage();
  const [state, setState] = useState<VoiceState>("idle");
  const recogRef = useRef<SpeechRecognition | null>(null);

  const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition;

  function startListening(): void {
    if (state === "listening") {
      // Second tap = cancel
      recogRef.current?.abort();
      setState("idle");
      return;
    }
    if (!Recog) return;

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
      if (e.error === "not-allowed") {
        setState("denied");   // permanent — user blocked mic access
      } else if (e.error === "no-speech") {
        setState("idle");     // silent fail — user just didn't speak
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 1500);
      }
    };

    r.onend = () => {
      // Fires after a result OR after the browser's own silence timeout.
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recogRef.current = r;
    r.start();
    setState("listening");
  }

  // Cleanup on unmount -- abort any in-flight recognition.
  useEffect(() => () => { recogRef.current?.abort(); }, []);

  if (!Recog || state === "denied") return null;

  return (
    <button
      type="button"
      onClick={startListening}
      title={state === "listening"
        ? (language === "ar" ? "تكلم الآن…" : "Parlez maintenant…")
        : (language === "ar" ? "البحث الصوتي" : "Recherche vocale")}
      className={(overlay ? "absolute " : "relative ") +
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors " +
        COLORS[variant][state] +
        " " + (className ?? "")}>
      {/* Pulse ring — only while listening */}
      {state === "listening" && (
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
      )}
      <Mic size={16} strokeWidth={2} className="relative z-10" />
    </button>
  );
}
