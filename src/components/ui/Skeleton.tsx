import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />;
}

export function FlightCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 flex items-center gap-3">
            <div className="space-y-1.5">
              <Skeleton className="w-14 h-6" />
              <Skeleton className="w-10 h-3" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-1 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="w-14 h-6" />
              <Skeleton className="w-10 h-3" />
            </div>
          </div>
        </div>
        <div className="flex sm:flex-col items-center gap-3 sm:min-w-[140px]">
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-2/3 h-4" />
        </div>
        <div className="space-y-2 sm:min-w-[120px]">
          <Skeleton className="w-full h-9 rounded-xl" />
          <Skeleton className="w-full h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
