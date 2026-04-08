"use client";

import { useEffect, useState } from "react";

export default function HydrationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className="text-xs text-zinc-500">Loading SIOS...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
