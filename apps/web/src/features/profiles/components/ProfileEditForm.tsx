"use client";

import type { ProfileDoc } from "@arbiter/db";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadImage,
  validateImageFile,
} from "@/features/images/lib/uploadImage";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/features/images/schema/image";
import { cn } from "@/lib/utils";
import { useSaveProfile } from "../hooks/useSaveProfile";
import { MAX_DISPLAY_NAME, profileDocSchema } from "../schema/profile";
import { UserAvatar } from "./UserAvatar";

/** Draft -> the raw shape `profileDocSchema` validates before signing. */
function toRawDoc(displayName: string, avatarUrl: string) {
  return { displayName, avatarUrl: avatarUrl || undefined };
}

/**
 * Inline profile edit form (spec 009): a display-name field and an avatar
 * picker. Validates with the same Zod schema the server enforces, uploads a new
 * avatar to `/api/images` first, then signs + persists via {useSaveProfile}.
 * Calls `onDone` on success (or cancel); on error it stays open and shows the
 * message (edit mode preserved).
 */
export function ProfileEditForm({
  userAddress,
  profile,
  onDone,
}: {
  userAddress: `0x${string}`;
  profile: ProfileDoc | null;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [invalid, setInvalid] = useState<string | null>(null);
  const { save, saving, error } = useSaveProfile(userAddress);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = profileDocSchema.safeParse(toRawDoc(displayName, avatarUrl));
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setInvalid(null);
    if (await save(parsed.data)) onDone();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <AvatarField
        address={userAddress}
        avatarUrl={avatarUrl}
        displayName={displayName}
        onChange={setAvatarUrl}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          maxLength={MAX_DISPLAY_NAME}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Ada Lovelace"
        />
      </div>

      {invalid || error ? (
        <p className="text-sm text-destructive">{invalid ?? error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Signing\u2026" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Avatar upload control: round preview (uploaded image or generated fallback)
 *  plus upload/remove actions. Uploads immediately and reports the resulting
 *  `/api/images/:id` url via `onChange`. */
function AvatarField({
  address,
  avatarUrl,
  displayName,
  onChange,
}: {
  address: string;
  avatarUrl: string;
  displayName: string;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSelect(file: File | undefined) {
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        address={address}
        avatarUrl={avatarUrl || undefined}
        displayName={displayName}
        size="lg"
      />
      <div className="flex flex-col gap-1">
        <Input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => onSelect(e.target.files?.[0])}
        />
        <div className="flex items-center gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(uploading && "pointer-events-none opacity-70")}
            onClick={() => inputRef.current?.click()}
          >
            {uploading
              ? "Uploading\u2026"
              : avatarUrl
                ? "Replace"
                : "Upload avatar"}
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                onChange("");
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {"PNG \u00B7 JPG \u00B7 WebP up to 2 MB"}
        </span>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
