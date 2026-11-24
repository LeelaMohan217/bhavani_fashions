export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[3/4] animate-pulse bg-sand" />
      <div className="mt-4 h-4 w-3/4 animate-pulse bg-sand" />
      <div className="mt-2 h-3 w-1/3 animate-pulse bg-sand" />
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
