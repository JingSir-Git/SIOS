"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  // Don't show if: no prompt available, already dismissed, or already installed
  if (!deferredPrompt || dismissed || installed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-zinc-900/95 backdrop-blur-lg px-4 py-3 shadow-2xl shadow-violet-500/10 max-w-sm">
        <div className="rounded-lg bg-violet-500/10 p-2 shrink-0">
          <Smartphone className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-200">安装 SIOS 到桌面</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">随时启动，更流畅的体验</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
        >
          <Download className="h-3 w-3" />
          安装
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
