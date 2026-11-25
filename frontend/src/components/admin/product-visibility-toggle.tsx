"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { setProductActive } from "@/lib/admin/actions";
import { useFeedback } from "@/components/ui/feedback";
import { rowAction } from "./ui";

/** Hide/show a product on the storefront ("delete" is hide-only by design). */
export function ProductVisibilityToggle({ id, isActive, name }: { id: string; isActive: boolean; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useFeedback();

  // Our own error bubble instead of the browser's alert(); clears itself after a few seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await setProductActive(id, !isActive);
            if (res.ok) {
              toast(isActive ? `${name} is hidden from the store` : `${name} is showing in the store`, {
                action: {
                  label: "Undo",
                  onClick: () =>
                    start(async () => {
                      const undo = await setProductActive(id, isActive);
                      if (undo.ok) router.refresh();
                      else setError(undo.error);
                    }),
                },
              });
              router.refresh();
            } else setError(res.error);
          })
        }
        aria-label={isActive ? `Hide ${name} from the store` : `Show ${name} in the store`}
        title={isActive ? "Hide from store" : "Show in store"}
        className={rowAction}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      {error && (
        <span
          role="alert"
          className="absolute right-full top-1/2 z-20 mr-2 w-max max-w-56 -translate-y-1/2 animate-palette-in rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-left text-xs text-red-700 shadow-md"
        >
          {error}
        </span>
      )}
    </span>
  );
}
