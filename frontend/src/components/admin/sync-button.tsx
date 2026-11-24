"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
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

// ─── Shared sync status, so the greeting can show it on phones ───────────────
export type SyncStatus = "idle" | "syncing" | "done";
let status: SyncStatus = "idle";
const listeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  status = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function useSyncStatus() {
  return useSyncExternalStore(subscribe, () => status, () => "idle" as SyncStatus);
}

/**
 * Re-fetches every server component on the page (dashboard, bell, sidebar counts).
 * Phones get a round icon-only button; the greeting's date line shows the status.
 */
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

  const sync = () => {
    setStatus("syncing");
    start(async () => {
      router.refresh();
      const t = Date.now();
      setSyncedAt(t);
      setNow(t);
      setJustSynced(true);
      setStatus("done");
      window.setTimeout(() => {
        setJustSynced(false);
        setStatus("idle");
      }, 1800);
    });
  };

  const icon =
    justSynced && !pending ? (
      <Check className="size-4 text-emerald-600" />
    ) : (
      <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
    );

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="hidden text-xs text-neutral-500 sm:block" aria-live="polite">
        {pending ? "Syncing…" : syncedAt && now ? `Updated ${ago(now - syncedAt)}` : ""}
      </span>
      {/* Phone: icon only */}
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        aria-label={pending ? "Syncing" : "Sync data"}
        className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-xs transition-colors active:bg-neutral-100 disabled:opacity-100 sm:hidden"
      >
        {icon}
      </button>
      {/* Wider screens: full button (wrapped, since btn.base sets its own display) */}
      <span className="hidden sm:block">
        <button type="button" onClick={sync} disabled={pending} className={`${btn.base} ${btn.secondary}`}>
          {icon}
          {pending ? "Syncing" : "Sync data"}
        </button>
      </span>
    </div>
  );
}
