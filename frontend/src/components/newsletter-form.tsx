"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

// UI only for now — wire to an email provider (e.g. Brevo/Resend) in a later phase.
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="mt-8 flex max-w-md items-center border-b border-canvas/30 focus-within:border-canvas"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        disabled={done}
        placeholder={done ? "Thank you — see you soon." : "Your email address"}
        className="h-12 flex-1 bg-transparent text-sm text-canvas placeholder:text-canvas/45 focus:outline-none"
      />
      <button
        type="submit"
        disabled={done}
        aria-label="Subscribe"
        className="inline-flex size-10 items-center justify-center text-canvas transition-transform hover:translate-x-1"
      >
        {done ? <Check className="size-4" strokeWidth={1.5} /> : <ArrowRight className="size-4" strokeWidth={1.5} />}
      </button>
    </form>
  );
}
