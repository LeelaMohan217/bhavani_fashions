"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { setProductActive } from "@/lib/admin/actions";
import { rowAction } from "./ui";

/** Hide/show a product on the storefront ("delete" is hide-only by design). */
export function ProductVisibilityToggle({ id, isActive, name }: { id: string; isActive: boolean; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setProductActive(id, !isActive);
          if (res.ok) router.refresh();
          else alert(res.error);
        })
      }
      aria-label={isActive ? `Hide ${name} from the store` : `Show ${name} in the store`}
      title={isActive ? "Hide from store" : "Show in store"}
      className={rowAction}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}
