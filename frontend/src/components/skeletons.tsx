export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[3/4] animate-pulse bg-sand" />
      <div className="mt-4 h-4 w-3/4 animate-pulse bg-sand" />
      <div className="mt-2 h-3 w-1/3 animate-pulse bg-sand" />
    </div>
  );
}

const Bar = ({ className = "" }: { className?: string }) => <div className={`animate-pulse bg-sand ${className}`} />;

/** One bag / order line: thumbnail, name, details, price. */
function LineSkeleton() {
  return (
    <li className="flex gap-5 py-6">
      <Bar className="aspect-[3/4] w-20 shrink-0 md:w-24" />
      <div className="flex-1 space-y-2.5 pt-1">
        <Bar className="h-5 w-3/5" />
        <Bar className="h-3 w-2/5" />
      </div>
      <Bar className="h-4 w-16" />
    </li>
  );
}

/** Sand summary panel with rows, a total and a button. */
function SummarySkeleton({ button = true }: { button?: boolean }) {
  return (
    <div className="border border-sand p-6 md:p-8">
      <Bar className="h-3 w-28" />
      <div className="mt-6 space-y-4">
        <div className="flex justify-between"><Bar className="h-3.5 w-20" /><Bar className="h-3.5 w-16" /></div>
        <div className="flex justify-between"><Bar className="h-3.5 w-16" /><Bar className="h-3.5 w-10" /></div>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <Bar className="h-3.5 w-12" />
          <Bar className="h-7 w-24" />
        </div>
      </div>
      {button && <Bar className="mt-6 h-14 w-full" />}
    </div>
  );
}

/** Body of the bag page while the cart loads (the page heading stays visible). */
export function BagSkeleton() {
  return (
    <div aria-busy aria-label="Loading your bag" className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-16">
      <ul className="divide-y divide-line border-y border-line lg:col-span-7">
        <LineSkeleton />
        <LineSkeleton />
      </ul>
      <aside className="lg:col-span-5">
        <SummarySkeleton />
      </aside>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div aria-busy aria-label="Loading checkout" className="container-x pb-10 pt-8 md:pt-14">
      <Bar className="h-3 w-24" />
      <Bar className="mt-6 h-14 w-64 md:h-20 md:w-96" />
      <div className="mt-8 grid gap-14 lg:mt-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-14 lg:col-span-7">
          {[2, 4, 2].map((fields, s) => (
            <div key={s}>
              <Bar className="h-3 w-32" />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {Array.from({ length: fields }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Bar className="h-3 w-20" />
                    <Bar className="h-12 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="hidden lg:col-span-5 lg:block">
          <ul className="divide-y divide-line">
            <LineSkeleton />
            <LineSkeleton />
          </ul>
          <div className="mt-6">
            <SummarySkeleton />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div aria-busy aria-label="Loading your order" className="container-x pb-10 pt-12 md:pt-20">
      <Bar className="size-14 rounded-full" />
      <Bar className="mt-8 h-3 w-48" />
      <Bar className="mt-4 h-14 w-3/4 max-w-xl md:h-20" />
      <Bar className="mt-6 h-4 w-full max-w-lg" />
      <Bar className="mt-2 h-4 w-2/3 max-w-md" />
      <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Bar className="h-3 w-20" />
          <ul className="mt-4 divide-y divide-line border-t border-line">
            <LineSkeleton />
            <LineSkeleton />
          </ul>
        </div>
        <aside className="lg:col-span-5">
          <SummarySkeleton button={false} />
        </aside>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
