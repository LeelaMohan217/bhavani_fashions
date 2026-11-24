"use client";

import { useSyncExternalStore } from "react";
import { useSyncStatus } from "./sync-button";

const noop = () => () => {};

function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function today() {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

/**
 * Time-of-day greeting in the admin's own timezone. The server renders a neutral
 * "Welcome back" and the browser swaps in the local greeting after hydrating.
 */
export function Greeting({ name, actions }: { name: string; actions?: React.ReactNode }) {
  const salutation = useSyncExternalStore(noop, partOfDay, () => "Welcome back");
  const date = useSyncExternalStore(noop, today, () => "");
  const first = name.split(" ")[0];
  const sync = useSyncStatus();

  return (
    <div data-rise className="mb-6 flex items-center justify-between gap-3 sm:items-end sm:gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">
          {salutation}, {first}
        </h1>
        <p className="mt-1 h-5 text-sm text-neutral-500">
          {/* Phones show the sync status here (their sync button is icon-only) */}
          {sync === "syncing" ? (
            <span className="sm:hidden">Syncing…</span>
          ) : sync === "done" ? (
            <span className="text-emerald-700 sm:hidden">Updated just now</span>
          ) : null}
          <span className={sync === "idle" ? "" : "max-sm:hidden"}>{date}</span>
        </p>
      </div>
      {actions}
    </div>
  );
}
