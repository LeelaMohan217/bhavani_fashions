"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

// Local UI state only — persisted wishlist arrives with customer accounts.
export function WishlistButton({ name, className = "" }: { name: string; className?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={() => setSaved((s) => !s)}
      className={`inline-flex size-9 items-center justify-center rounded-full bg-canvas/85 text-ink backdrop-blur transition hover:bg-canvas ${className}`}
    >
      <Heart
        className={`size-4 transition-transform duration-300 ${saved ? "scale-110 fill-clay text-clay" : ""}`}
        strokeWidth={1.5}
      />
    </button>
  );
}
