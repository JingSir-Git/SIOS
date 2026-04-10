"use client";

import { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type ToastItem } from "@/lib/store";

const TOAST_ICONS: Record<ToastItem["type"], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_COLORS: Record<ToastItem["type"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

const TOAST_ICON_COLORS: Record<ToastItem["type"], string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-blue-400",
  warning: "text-amber-400",
};

function ToastEntry({ toast }: { toast: ToastItem }) {
  const { removeToast, setActiveTab } = useAppStore();
  const Icon = TOAST_ICONS[toast.type];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md",
        "animate-in slide-in-from-right-5 fade-in-0 duration-300",
        TOAST_COLORS[toast.type]
      )}
      role="alert"
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", TOAST_ICON_COLORS[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200">{toast.title}</p>
        {toast.message && (
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              if (toast.action?.tab) setActiveTab(toast.action.tab);
              removeToast(toast.id);
            }}
            className="flex items-center gap-1 mt-1.5 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            {toast.action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastEntry key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
