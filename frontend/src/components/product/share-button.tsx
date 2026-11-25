"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Phones (and browsers with a share sheet): opens the device's share options (WhatsApp,
 * Instagram, messages…). Elsewhere: copies the page link and says so for a moment.
 */
export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closing the share sheet isn't an error worth showing
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button type="button" onClick={share} className={`inline-flex items-center gap-2 ${className}`}>
      {copied ? <Check className="size-3.5" strokeWidth={1.5} /> : <Share2 className="size-3.5" strokeWidth={1.5} />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
