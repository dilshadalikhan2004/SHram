import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const DashboardPageSkeleton = ({ withSidebar = true }) => (
  <div className="space-y-10">
    <div className="rounded-[2.5rem] border border-white/10 glass-card p-10 space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-14 w-80 max-w-full" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>

    <div className={`grid grid-cols-1 ${withSidebar ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-8`}>
      <div className={withSidebar ? 'lg:col-span-8 space-y-6' : 'space-y-6'}>
        <Skeleton className="h-9 w-72 max-w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[2rem] border border-white/5 p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-52 max-w-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {withSidebar && (
        <div className="lg:col-span-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[2rem] border border-white/5 p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const ListPageSkeleton = ({ withTabs = false, cards = 3 }) => (
  <div className="space-y-8">
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-72 max-w-full" />
      </div>
      <Skeleton className="h-12 w-48 rounded-2xl" />
    </div>

    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      {withTabs && (
        <div className="flex gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-36" />
        </div>
      )}
    </div>

    <div className="space-y-5">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-[2rem] border border-white/5 p-6 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-72 max-w-full" />
              <Skeleton className="h-4 w-52 max-w-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProfilePageSkeleton = () => (
  <div className="space-y-8 pb-20">
    <div className="flex items-end justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-56" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-24 w-24 rounded-[2rem]" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-[2.5rem] border border-white/5 p-8 space-y-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-[2.5rem] border border-white/5 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DetailPageSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-8 w-24" />
    <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-5">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-12 w-3/4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    </div>
    <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-10/12" />
    </div>
    <div className="rounded-[2.5rem] border border-white/5 p-8 space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-xl" />)}
      </div>
    </div>
  </div>
);

export const WorkersGridSkeleton = () => (
  <div className="space-y-10">
    <div className="space-y-3">
      <Skeleton className="h-14 w-96 max-w-full" />
      <Skeleton className="h-5 w-72 max-w-full" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-[2.5rem] border border-white/5 p-8 space-y-5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
          <div className="rounded-2xl border border-white/10 p-4 space-y-3">
            <Skeleton className="h-5 w-56 max-w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
