import { connection } from "next/server";
import { Suspense } from "react";
import { PROMISES } from "@/lib/content";
import { getPromotion } from "@/lib/api";
import { PromoBar } from "./promo/promo-bar";

export function AnnouncementBar() {
  return (
    <Suspense fallback={<PromisesBar />}>
      <WithPromotion />
    </Suspense>
  );
}

/** During a store-wide offer (e.g. Black Friday) the top bar announces it instead. */
async function WithPromotion() {
  await connection();
  const promo = await getPromotion().catch(() => null);
  return promo ? <PromoBar promo={promo} fallback={<PromisesBar />} /> : <PromisesBar />;
}

function PromisesBar() {
  // Duplicated list so the marquee loops seamlessly
  const items = [...PROMISES, ...PROMISES];

  return (
    <div className="overflow-hidden bg-ink text-canvas" role="region" aria-label="Store promises">
      <ul className="flex w-max animate-marquee py-2.5 hover:[animation-play-state:paused]">
        {items.map((text, i) => (
          <li
            key={i}
            aria-hidden={i >= PROMISES.length}
            className="eyebrow flex items-center gap-10 pr-10 text-[0.625rem] text-canvas/85"
          >
            {text}
            <span className="size-1 rounded-full bg-clay" />
          </li>
        ))}
      </ul>
    </div>
  );
}
