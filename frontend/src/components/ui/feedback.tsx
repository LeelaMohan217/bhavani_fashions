"use client";

// One place for confirmation popups and toasts, styled for either the store or the admin.
// useFeedback().confirm({...}) resolves true/false; useFeedback().toast("Saved", { action }) shows a small pill.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { lockPageScroll } from "@/lib/scroll-lock";

type Tone = "store" | "admin";

export type ConfirmOptions = {
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red action button for deletes and cancellations */
  danger?: boolean;
};

type ToastOptions = {
  action?: { label: string; onClick: () => void };
  error?: boolean;
};

type FeedbackValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (message: string, options?: ToastOptions) => void;
};

const FeedbackContext = createContext<FeedbackValue | null>(null);

const STYLE: Record<
  Tone,
  { panel: string; title: string; body: string; cancel: string; confirm: string; danger: string; toast: string; toastAction: string; toastWrap: string }
> = {
  store: {
    panel: "w-full max-w-sm bg-canvas p-6 shadow-[0_24px_60px_-20px_rgb(17_17_17/0.45)]",
    title: "font-display text-xl leading-snug text-ink",
    body: "mt-2 text-sm leading-relaxed text-ink-soft",
    cancel: "eyebrow h-10 px-5 text-[0.625rem] text-ink-soft transition-colors hover:text-ink",
    confirm: "eyebrow h-10 bg-ink px-5 text-[0.625rem] text-canvas transition-colors hover:bg-clay-deep",
    danger: "eyebrow h-10 bg-clay px-5 text-[0.625rem] text-canvas transition-colors hover:bg-clay-deep",
    toast: "bg-ink text-canvas text-sm",
    toastAction: "eyebrow text-[0.625rem] text-canvas underline underline-offset-4 hover:text-sand",
    // Above the floating WhatsApp button on phones
    toastWrap: "bottom-24 md:bottom-6",
  },
  admin: {
    panel: "w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl",
    title: "text-base font-semibold text-neutral-900",
    body: "mt-1.5 text-sm leading-relaxed text-neutral-600",
    cancel: "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
    confirm: "inline-flex h-9 items-center rounded-md bg-neutral-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700",
    danger: "inline-flex h-9 items-center rounded-md bg-red-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-red-700",
    toast: "rounded-lg bg-neutral-900 text-white text-sm shadow-lg",
    toastAction: "rounded px-1.5 py-0.5 text-sm font-medium text-white underline underline-offset-2 hover:bg-white/10",
    // Clear the phone tab bar and the editors' sticky save bar
    toastWrap: "bottom-36 md:bottom-20",
  },
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };
type ToastState = { id: number; message: string } & ToastOptions;

export function FeedbackProvider({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const s = STYLE[tone];
  const [pending, setPending] = useState<Pending | null>(null);
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  const toast = useCallback((message: string, options?: ToastOptions) => {
    window.clearTimeout(timer.current);
    const id = Date.now();
    setToastState({ id, message, ...options });
    timer.current = window.setTimeout(() => setToastState((t) => (t?.id === id ? null : t)), options?.action ? 6000 : 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Focus the action, close on Escape, keep the page behind still
  useEffect(() => {
    if (!pending) return;
    confirmBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    const unlock = lockPageScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [pending, close]);

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => close(false)} className="absolute inset-0 animate-fade-in bg-[rgba(17,17,17,0.45)]" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pending.body ? "confirm-body" : undefined}
            className={`relative animate-palette-in ${s.panel}`}
          >
            <h2 id="confirm-title" className={s.title}>
              {pending.title}
            </h2>
            {pending.body && (
              <div id="confirm-body" className={s.body}>
                {pending.body}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className={s.cancel}>
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button ref={confirmBtn} type="button" onClick={() => close(true)} className={pending.danger ? s.danger : s.confirm}>
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4 ${s.toastWrap}`}>
        {toastState && (
          <div key={toastState.id} className={`pointer-events-auto flex animate-toast-in items-center gap-3 py-2.5 pl-3.5 pr-3 ${s.toast}`}>
            {toastState.error ? (
              <CircleAlert className="size-4 shrink-0 text-red-300" strokeWidth={1.75} />
            ) : (
              <Check className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
            )}
            <span>{toastState.message}</span>
            {toastState.action && (
              <button
                type="button"
                onClick={() => {
                  toastState.action!.onClick();
                  setToastState(null);
                }}
                className={s.toastAction}
              >
                {toastState.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}
