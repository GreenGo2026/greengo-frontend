import { useEffect, useState } from "react";
import { getVoiceLog, subscribeVoiceLog, type VoiceLogEntry } from "../utils/voiceDebugLog";

// Rendered only when ?debug=voice is in the URL (gated by the caller via
// isVoiceDebugEnabled()). Fixed to the bottom of the viewport so it's
// visible over any page content, including inside the search bars.
export default function VoiceDebugPanel() {
  const [entries, setEntries] = useState<VoiceLogEntry[]>(getVoiceLog());

  useEffect(() => subscribeVoiceLog(() => setEntries(getVoiceLog())), []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] max-h-56 overflow-y-auto border-t border-emerald-500/30 bg-black/95 p-2 font-mono text-[10px] text-emerald-300">
      <p className="mb-1 truncate font-bold text-white">
        🎤 Voice debug — {navigator.userAgent.slice(0, 70)}…
      </p>
      {entries.length === 0 && <p className="text-white/40">No events yet — tap the mic.</p>}
      {entries.map((e, i) => (
        <div key={i} className="whitespace-pre-wrap break-all leading-tight">
          <span className="text-white/40">{e.time}</span>{" "}
          <span className="text-emerald-400">{e.event}</span>
          {e.detail ? <span className="text-white/70"> — {e.detail}</span> : null}
        </div>
      ))}
    </div>
  );
}
