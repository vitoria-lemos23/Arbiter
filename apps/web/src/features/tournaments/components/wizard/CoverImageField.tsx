"use client";

import { useId, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from "@/features/images/schema/image";
import { cn } from "@/lib/utils";
import type { WizardValues } from "../../schema/createTournament";

/** Client-side guard mirroring the server allow-list (Business Rule #6). */
function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as never)) {
    return "Image must be a PNG, JPEG, or WebP";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 2 MB or smaller";
  return null;
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/images", { method: "POST", body });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? "Upload failed");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

/**
 * Wizard cover picker: validates + uploads the file immediately to `/api/images`
 * and stores the returned `/api/images/:id` URL in the `imageUrl` form field.
 * An upload error blocks deploy by keeping the field empty and surfacing a
 * message; the field itself is optional (a tournament may have no cover).
 */
export function CoverImageField() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { control } = useFormContext<WizardValues>();
  const { field } = useController({ control, name: "imageUrl" });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSelect(file: File | undefined) {
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) {
      setError(invalid);
      field.onChange("");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      field.onChange(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      field.onChange("");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    field.onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Cover image</span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
      {field.value ? (
        <CoverPreview
          url={field.value}
          onReplace={() => inputRef.current?.click()}
          onRemove={clear}
        />
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "grid cursor-pointer place-items-center gap-1 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors hover:border-primary",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <span className="text-sm text-muted-foreground">
            {uploading ? "Uploading…" : "Click to upload a cover image"}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            PNG · JPG · WebP up to 2 MB
          </span>
        </label>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function CoverPreview({
  url,
  onReplace,
  onRemove,
}: {
  url: string;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Uploaded cover preview; plain <img> keeps this a single served route. */}
      {/* biome-ignore lint/performance/noImgElement: previewing a just-uploaded blob URL */}
      <img
        src={url}
        alt="Cover preview"
        className="h-40 w-full rounded-lg border border-input object-cover"
      />
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onReplace}
          className="text-primary hover:underline"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
