"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/ui/feedback";

/**
 * While a form has unsaved changes, asks before leaving: a popup for links inside the admin,
 * and the browser's own prompt for closing or reloading the tab.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const { confirm } = useFeedback();

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      e.stopPropagation();
      void confirm({
        title: "Leave without saving?",
        body: "Your changes on this page haven't been saved and will be lost.",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
        danger: true,
      }).then((ok) => {
        // Client-side navigation, so the browser's leave prompt doesn't fire as well
        if (ok) router.push(url.pathname + url.search + url.hash);
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase so it runs before Next's Link handler
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, confirm, router]);
}
