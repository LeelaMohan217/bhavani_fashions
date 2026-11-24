"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw } from "lucide-react";
import { btn } from "./ui";

function ago(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 30) return "just now";
  if (s < 90) return "1 min ago";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

/** Re-fetches every server component on the page (dashboard, bell, sidebar counts). */
export function SyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [justSynced, setJustSynced] = useState(false);

  // Start the clock on mount and tick every 30s so "x min ago" stays honest.
  useEffect(() => {
    const t = Date.now();
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    const first = window.setTimeout(() => {
      setSyncedAt(t);
      setNow(t);
    }, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, []);

  const sync = () =>
    start(async () => {
      router.refresh();
      const t = Date.now();
      setSyncedAt(t);
      setNow(t);
      setJustSynced(true);
      window.setTimeout(() => setJustSynced(false), 1800);
    });

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-neutral-500 sm:block" aria-live="polite">
        {pending ? "Syncing…" : syncedAt && now ? `Updated ${ago(now - syncedAt)}` : ""}
      </span>
      <button type="button" onClick={sync} disabled={pending} className={`${btn.base} ${btn.secondary}`}>
        {justSynced && !pending ? (
          <Check className="size-4 text-emerald-600" />
        ) : (
          <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        )}
        {pending ? "Syncing" : "Sync data"}
      </button>
    </div>
  );
}
