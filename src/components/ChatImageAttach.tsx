"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";

export interface AttachedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;
  description?: string;
  loading?: boolean;
}

interface ChatImageAttachProps {
  images: AttachedImage[];
  onChange: (images: AttachedImage[]) => void;
  maxCount?: number;
  disabled?: boolean;
  /** OCR mode passed to /api/ocr — "chat" for screenshots, "face", "palm" */
  ocrMode?: string;
  compact?: boolean;
}

export default function ChatImageAttach({
  images,
  onChange,
  maxCount = 3,
  disabled = false,
  ocrMode = "chat",
  compact = false,
}: ChatImageAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const addFile = useCallback(
    async (file: File) => {
      if (images.length >= maxCount) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return;

      const id = `attach_${Date.now()}`;
      const previewUrl = URL.createObjectURL(file);

      // Read base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const newImg: AttachedImage = { id, file, previewUrl, base64, loading: true };
      const updated = [...images, newImg];
      onChange(updated);

      // Auto-OCR for image description
      setProcessing(true);
      try {
        const res = await apiFetch("/api/ocr", {
          method: "POST",
          body: JSON.stringify({ image: base64, mode: ocrMode }),
        });
        if (res.ok) {
          const data = await res.json();
          newImg.description = data.text || "";
        }
      } catch {
        // OCR failed — attach without description
      }
      newImg.loading = false;
      onChange([...updated.filter((i) => i.id !== id), newImg]);
      setProcessing(false);
    },
    [images, maxCount, ocrMode, onChange]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      for (let i = 0; i < files.length && images.length + i < maxCount; i++) {
        await addFile(files[i]);
      }
    },
    [addFile, images.length, maxCount]
  );

  const removeImage = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      onChange(images.filter((i) => i.id !== id));
    },
    [images, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="flex items-center gap-1.5">
      {/* Thumbnails of attached images */}
      {images.map((img) => (
        <div
          key={img.id}
          className="relative group rounded-lg border border-zinc-700/50 overflow-hidden"
          style={{ width: compact ? 32 : 40, height: compact ? 32 : 40 }}
        >
          <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
          {img.loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
            </div>
          )}
          {!img.loading && img.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/30 h-0.5" />
          )}
          <button
            onClick={() => removeImage(img.id)}
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-2 w-2" />
          </button>
        </div>
      ))}

      {/* Attach button */}
      {images.length < maxCount && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple={maxCount > 1}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled || processing}
            className={cn(
              "flex items-center justify-center rounded-lg border transition-all",
              compact ? "w-8 h-8" : "w-10 h-10",
              disabled || processing
                ? "bg-zinc-800/30 border-zinc-800 text-zinc-700 cursor-not-allowed"
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-violet-400 hover:border-violet-500/30"
            )}
            title="附加图片（AI可看图理解）"
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
          </button>
        </>
      )}
    </div>
  );
}

/** Format attached images into text context for the AI */
export function formatAttachedImages(images: AttachedImage[]): string {
  const described = images.filter((i) => i.description);
  if (described.length === 0) return "";
  return described
    .map((img, i) => `【附图${i + 1}识别内容】\n${img.description}`)
    .join("\n\n");
}
