// Loading skeletons for admin pages. Each mirrors its page's real layout (cards, headers,
// toolbars) using the same pulsing-bar style, so the hand-off to real content doesn't jump.

export const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
);

function CardShell({ title = true, children, className = "" }: { title?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-neutral-200 bg-white shadow-xs ${className}`}>
      {title && (
        <div className="border-b border-neutral-100 px-5 py-3.5">
          <Bar className="h-4 w-28" />
        </div>
      )}
      {children}
    </section>
  );
}

/** Orders / Products: toolbar, column headers, rows and the pagination bar */
export function TableCardSkeleton({ rows = 10, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-xs" aria-busy aria-label="Loading">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
        <div className="h-8 w-full rounded-md border border-neutral-200 sm:w-72" />
        <div className="h-8 w-20 rounded-md border border-neutral-200" />
        <div className="ml-auto h-8 w-24 rounded-md border border-neutral-200" />
      </div>
      <div className="flex gap-6 border-b border-neutral-100 px-4 py-3">
        {[20, 14, 14, 12, 12].map((w, i) => (
          <div key={i} style={{ width: `${w}%` }}>
            <Bar className="h-2.5" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            {avatar ? <Bar className="size-8 rounded-full" /> : <Bar className="h-11 w-9" />}
            <div className="w-[22%] space-y-1.5">
              <Bar className="h-3.5 w-full" />
              <Bar className="h-3 w-2/3" />
            </div>
            <Bar className="h-3.5 w-[14%]" />
            <Bar className="h-5 w-16 rounded-full" />
            <Bar className="ml-auto h-3.5 w-14" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
        <Bar className="h-3 w-28" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <Bar key={i} className="size-7 rounded-md" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Order detail: header, actions + items + timeline on the left, customer/address/payment on the right */
export function OrderDetailSkeleton() {
  return (
    <div aria-busy aria-label="Loading order">
      <div className="mb-6 space-y-3">
        <Bar className="h-3.5 w-16" />
        <div className="flex items-center gap-3">
          <Bar className="h-7 w-28 bg-neutral-200/70" />
          <Bar className="h-5 w-16 rounded-full" />
          <Bar className="h-5 w-16 rounded-full" />
        </div>
        <Bar className="h-3.5 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <CardShell title={false}>
            <div className="space-y-3 px-5 py-4">
              <Bar className="h-4 w-28" />
              <Bar className="h-3.5 w-3/4" />
              <div className="flex gap-2 pt-1">
                <Bar className="h-9 w-28 rounded-md" />
                <Bar className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </CardShell>
          <CardShell>
            <div className="divide-y divide-neutral-100">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Bar className="h-16 w-12" />
                  <div className="flex-1 space-y-2">
                    <Bar className="h-4 w-1/2" />
                    <Bar className="h-3 w-1/3" />
                  </div>
                  <Bar className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardShell>
          <CardShell>
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Bar className="h-3.5 w-1/2" />
                  <Bar className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          </CardShell>
        </div>
        <div className="min-w-0 space-y-6">
          {[3, 4, 2].map((lines, i) => (
            <CardShell key={i}>
              <div className="space-y-2.5 p-5">
                {Array.from({ length: lines }, (_, j) => (
                  <Bar key={j} className={`h-3.5 ${j === 0 ? "w-1/2" : "w-3/4"}`} />
                ))}
              </div>
            </CardShell>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Product editor: basics, images, variants on the left; visibility, pricing, organisation on the right */
export function ProductEditorSkeleton() {
  const field = (w = "w-full") => (
    <div className="space-y-1.5">
      <Bar className="h-3 w-20" />
      <div className={`h-9 rounded-md border border-neutral-200 ${w}`} />
    </div>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-busy aria-label="Loading product">
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <CardShell>
          <div className="space-y-4 p-5">
            {field()}
            {field()}
            <div className="space-y-1.5">
              <Bar className="h-3 w-24" />
              <div className="h-28 rounded-md border border-neutral-200" />
            </div>
          </div>
        </CardShell>
        <CardShell>
          <div className="flex gap-3 p-5">
            {[0, 1].map((i) => (
              <Bar key={i} className="h-20 w-15" />
            ))}
          </div>
        </CardShell>
        <CardShell>
          <div className="divide-y divide-neutral-100">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Bar className="size-9 rounded-md" />
                <Bar className="h-9 flex-1 rounded-md" />
                <Bar className="h-9 w-16 rounded-md" />
                <Bar className="h-9 w-28 rounded-md" />
                <Bar className="h-9 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </CardShell>
      </div>
      <div className="min-w-0 space-y-6">
        <CardShell>
          <div className="space-y-4 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <Bar className="h-3.5 w-24" />
                  <Bar className="h-3 w-full" />
                </div>
                <Bar className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </CardShell>
        <CardShell>
          <div className="space-y-4 p-5">
            {field()}
            {field()}
          </div>
        </CardShell>
        <CardShell>
          <div className="space-y-4 p-5">
            {field()}
            {field()}
            {field()}
          </div>
        </CardShell>
      </div>
    </div>
  );
}

/** Settings: two-column grid of key/value cards plus a full-width account card */
export function SettingsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy aria-label="Loading settings">
      {[4, 2, 5, 3].map((rows, i) => (
        <CardShell key={i}>
          <div className="divide-y divide-neutral-100 px-5 py-2">
            {Array.from({ length: rows }, (_, j) => (
              <div key={j} className="flex justify-between gap-6 py-2.5">
                <Bar className="h-3.5 w-28" />
                <Bar className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </CardShell>
      ))}
      <CardShell className="lg:col-span-2">
        <div className="flex items-center gap-4 p-5">
          <Bar className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-32" />
            <Bar className="h-3.5 w-48" />
          </div>
        </div>
      </CardShell>
    </div>
  );
}
