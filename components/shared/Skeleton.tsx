import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  );
};

export const ReceiptSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[340px] space-y-4 p-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-20 w-2/3" />
        <Skeleton className="h-20 w-1/4" />
      </div>
    </div>
  );
};
