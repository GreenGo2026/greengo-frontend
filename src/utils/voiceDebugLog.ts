// In-memory event log for the ?debug=voice panel -- lets us see what a
// device actually did (environment, every recognizer event, start()
// exceptions, "ended with no result") without needing DevTools on a phone.
// Module-level singleton + pub-sub so VoiceSearchButton (writer) and
// VoiceDebugPanel (reader) don't need to be siblings or share props.

export interface VoiceLogEntry {
  time:    string;
  event:   string;
  detail?: string;
}

const MAX_ENTRIES = 50;
let entries: VoiceLogEntry[] = [];
const listeners = new Set<() => void>();

function fmtTime(): string {
  const d = new Date();
  return d.toLocaleTimeString("fr-FR", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function logVoiceEvent(event: string, detail?: string): void {
  entries = [...entries, { time: fmtTime(), event, detail }].slice(-MAX_ENTRIES);
  listeners.forEach((l) => l());
}

export function getVoiceLog(): VoiceLogEntry[] {
  return entries;
}

export function subscribeVoiceLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isVoiceDebugEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("debug") === "voice";
  } catch {
    return false;
  }
}
