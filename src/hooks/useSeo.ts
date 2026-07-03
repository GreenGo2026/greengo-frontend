// src/hooks/useSeo.ts
import { useEffect } from "react";

export interface SeoOptions {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
}

export function useSeo({ title, description, ogTitle, ogDescription, ogType = "website" }: SeoOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        prop ? el.setAttribute("property", name) : el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", ogTitle || title, true);
    setMeta("og:description", ogDescription || description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:url", window.location.href, true);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, ogTitle, ogDescription, ogType]);
}
