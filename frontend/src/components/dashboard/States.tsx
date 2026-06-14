"use client";

/** Shimmering placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-emerald-200/[0.06] ${className}`} />;
}

/** A generic dashboard loading layout: header + a grid of card skeletons. */
export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

/** Friendly empty state with an icon, title, and optional hint. */
export function EmptyState({ icon = "inbox", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200/10 bg-emerald-950/30 p-10 text-center backdrop-blur-md">
      <i className={`ti ti-${icon} text-3xl text-emerald-300/60`} aria-hidden />
      <p className="mt-3 font-light text-emerald-50/75">{title}</p>
      {hint && <p className="mt-1 text-sm font-light text-emerald-50/40">{hint}</p>}
    </div>
  );
}
