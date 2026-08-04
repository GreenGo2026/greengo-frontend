// src/hooks/useDeliveryUrgency.ts
import { useState, useEffect } from "react";

export interface DeliveryUrgency {
  message:     string;  // "⏰ Plus que 1h30" / "Commandez avant 21h"
  subMessage:  string;  // "pour être livré ce soir"
  isUrgent:    boolean; // <= 2h remaining before close
  isAvailable: boolean; // within the 8h-21h delivery window
  minutesLeft: number;  // until close, 0 if unavailable
}

// Matches the 8h-21h window already advertised sitewide (AnnouncementBar,
// SocialProofStrip, hero, legal pages) and utils/urgencySignals.ts's
// getDeliveryUrgency() -- there's no separate "last order" cutoff anywhere
// else in the app, so this hook doesn't invent one (a 20h30 cutoff would
// contradict the "8h-21h" promise shown elsewhere on the same page).
const DELIVERY_START = 8;
const DELIVERY_END   = 21;

export function useDeliveryUrgency(): DeliveryUrgency {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Local device time -- for real users browsing from Morocco this is
  // already Morocco time, no manual UTC offset needed (and hardcoding one
  // would actually be wrong for anyone not physically in that timezone).
  const hour   = now.getHours();
  const minute = now.getMinutes();

  const isAvailable = hour >= DELIVERY_START && hour < DELIVERY_END;

  if (!isAvailable) {
    const nextDay = hour >= DELIVERY_END;
    return {
      message: "Livraison disponible",
      subMessage: nextDay
        ? `demain dès ${DELIVERY_START}h`
        : `aujourd'hui de ${DELIVERY_START}h à ${DELIVERY_END}h`,
      isUrgent: false,
      isAvailable: false,
      minutesLeft: 0,
    };
  }

  const minutesLeft = (DELIVERY_END - hour) * 60 - minute;
  const isUrgent = minutesLeft <= 120;

  let message: string;
  let subMessage: string;

  if (minutesLeft <= 30) {
    message = `⚡ Dernières ${minutesLeft} min !`;
    subMessage = "Commandez maintenant";
  } else if (isUrgent) {
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    message = `⏰ Plus que ${h}h${m > 0 ? m : ""}`;
    subMessage = "pour être livré ce soir";
  } else {
    message = `Commandez avant ${DELIVERY_END}h`;
    subMessage = "— livré ce soir en 30 min";
  }

  return { message, subMessage, isUrgent, isAvailable: true, minutesLeft };
}
