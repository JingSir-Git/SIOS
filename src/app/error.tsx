"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SIOS] Page error:", error);
    // Auto-reload once on deployment mismatch errors
    const msg = error.message || "";
    if (
      msg.includes("Failed to find Server Action") ||
      msg.includes("could not load") ||
      msg.includes("ChunkLoadError")
    ) {
      const key = "sios_auto_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-zinc-950">
      <div className="rounded-full bg-red-500/10 p-5 mb-5">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">
        页面加载失败
      </h2>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        可能是版本更新导致的缓存问题，请点击下方按钮刷新。
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm bg-violet-600 text-white hover:bg-violet-500 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          重试
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          硬刷新
        </button>
      </div>
    </div>
  );
}
