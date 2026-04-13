"use client";

import { useState, useRef, useCallback } from "react";
import {
  ImagePlus,
  X,
  Loader2,
  Camera,
  FileImage,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;       // populated after reading
  ocrText?: string;      // populated after OCR
  ocrLoading?: boolean;
}

interface ImageUploadProps {
  /** Accepted MIME types. Default: common image types */
  accept?: string;
  /** Max number of images. Default: 5 */
  maxCount?: number;
  /** Max single file size in MB. Default: 10 */
  maxSizeMB?: number;
  /** Callback when images change */
  onChange: (images: UploadedImage[]) => void;
  /** Current images list */
  images: UploadedImage[];
  /** Show OCR button per image */
  showOCR?: boolean;
  /** Callback when OCR is requested */
  onOCR?: (imageId: string) => void;
  /** Compact mode */
  compact?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Additional className */
  className?: string;
}

export default function ImageUpload({
  accept = "image/png,image/jpeg,image/webp,image/gif,image/bmp",
  maxCount = 5,
  maxSizeMB = 10,
  onChange,
  images,
  showOCR = false,
  onOCR,
  compact = false,
  placeholder = "点击或拖拽图片到此处",
  label,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const newImages: UploadedImage[] = [];
      const existingCount = images.length;

      for (let i = 0; i < files.length; i++) {
        if (existingCount + newImages.length >= maxCount) break;
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > maxSizeMB * 1024 * 1024) continue;

        const id = `img_${Date.now()}_${i}`;
        const previewUrl = URL.createObjectURL(file);
        newImages.push({ id, file, previewUrl });
      }

      if (newImages.length > 0) {
        // Read base64 for each
        newImages.forEach((img) => {
          const reader = new FileReader();
          reader.onload = () => {
            img.base64 = reader.result as string;
            onChange([...images, ...newImages]);
          };
          reader.readAsDataURL(img.file);
        });
        // Immediately update with previews (base64 will populate async)
        onChange([...images, ...newImages]);
      }
    },
    [images, maxCount, maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
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
        processFiles(files);
      }
    },
    [processFiles]
  );

  const removeImage = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      onChange(images.filter((i) => i.id !== id));
      if (previewId === id) setPreviewId(null);
    },
    [images, onChange, previewId]
  );

  const previewImage = previewId ? images.find((i) => i.id === previewId) : null;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
          <ImagePlus className="h-3 w-3" />
          {label}
        </label>
      )}

      {/* Drop zone */}
      {images.length < maxCount && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl cursor-pointer transition-all",
            compact ? "px-3 py-2" : "px-4 py-6",
            dragOver
              ? "border-violet-500/60 bg-violet-500/5"
              : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/30"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxCount > 1}
            onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }}
            className="hidden"
          />
          <div className={cn("flex items-center gap-2", compact ? "justify-start" : "flex-col justify-center text-center")}>
            {compact ? (
              <>
                <Camera className="h-4 w-4 text-zinc-500" />
                <span className="text-[10px] text-zinc-500">{placeholder}</span>
                <span className="text-[9px] text-zinc-600">({images.length}/{maxCount})</span>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 mb-1">
                  <FileImage className="h-6 w-6 text-zinc-500" />
                </div>
                <p className="text-xs text-zinc-400">{placeholder}</p>
                <p className="text-[9px] text-zinc-600">
                  支持 PNG/JPG/WebP · 单张最大 {maxSizeMB}MB · 可粘贴截图 · {images.length}/{maxCount}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-lg border border-zinc-700/50 bg-zinc-800/30 overflow-hidden"
              style={{ width: compact ? 56 : 80, height: compact ? 56 : 80 }}
            >
              <img
                src={img.previewUrl}
                alt="uploaded"
                className="w-full h-full object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewId(previewId === img.id ? null : img.id); }}
                  className="p-1 rounded bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors"
                  title="预览"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
                {showOCR && onOCR && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOCR(img.id); }}
                    disabled={img.ocrLoading}
                    className="p-1 rounded bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors"
                    title="OCR识别"
                  >
                    {img.ocrLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileImage className="h-3 w-3" />
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="p-1 rounded bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                  title="删除"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* OCR badge */}
              {img.ocrText && (
                <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/20 text-center">
                  <span className="text-[7px] text-emerald-400 font-medium">已识别</span>
                </div>
              )}

              {/* Loading overlay */}
              {img.ocrLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="relative max-w-3xl max-h-[85vh] rounded-xl overflow-hidden border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.previewUrl} alt="preview" className="max-w-full max-h-[80vh] object-contain" />
            <div className="absolute top-2 right-2 flex gap-1">
              <button onClick={() => setPreviewId(null)} className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {previewImage.ocrText && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3 max-h-32 overflow-y-auto">
                <p className="text-[9px] text-emerald-400 font-medium mb-1">OCR 识别结果:</p>
                <p className="text-[10px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{previewImage.ocrText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
