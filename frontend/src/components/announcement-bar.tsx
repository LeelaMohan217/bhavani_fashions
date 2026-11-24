import { PROMISES } from "@/lib/content";

export function AnnouncementBar() {
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
