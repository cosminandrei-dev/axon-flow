import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic page skeleton for list pages (workflows, agents, logs).
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content skeleton */}
      <div className="rounded-lg border border-border bg-background-secondary p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
}
