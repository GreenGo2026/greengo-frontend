// Web Speech API — not covered by standard @types packages.
// Everything lives inside `declare global` because this file has a
// top-level `export {}`, making it a module -- without that wrapper,
// these interfaces would be local to this file instead of ambient
// globals usable anywhere without an import.

export {};

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;   // "not-allowed" | "no-speech" | "network" | ...
    readonly message: string;
  }

  interface SpeechRecognition extends EventTarget {
    lang:            string;
    continuous:      boolean;
    interimResults:  boolean;
    maxAlternatives: number;
    start():  void;
    stop():   void;
    abort():  void;
    onresult:    ((e: SpeechRecognitionEvent)      => void) | null;
    onerror:     ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend:       (() => void) | null;
    onspeechend: (() => void) | null;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?:       SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
