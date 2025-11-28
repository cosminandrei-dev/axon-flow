import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading state for the settings page.
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Settings grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background-secondary p-6"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="rounded-lg border border-border bg-background-secondary p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
