"use client";

import type { TournamentMetadataDoc } from "@arbiter/db";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTournamentMetadata } from "../../hooks/useUpdateTournamentMetadata";
import { tournamentMetadataSchema } from "../../schema/metadata";
import { CoverImagePicker } from "../CoverImagePicker";

type Draft = {
  name: string;
  description: string;
  game: string;
  category: string;
  tags: string;
  rules: string;
  imageUrl: string;
};

/** Seeds the editable draft from the current (possibly absent) metadata doc. */
function toDraft(metadata: TournamentMetadataDoc | null): Draft {
  return {
    name: metadata?.name ?? "",
    description: metadata?.description ?? "",
    game: metadata?.game ?? "",
    category: metadata?.category ?? "",
    tags: (metadata?.tags ?? []).join(", "),
    rules: metadata?.rules ?? "",
    imageUrl: metadata?.imageUrl ?? "",
  };
}

/** Draft -> the raw shape `tournamentMetadataSchema` validates before signing. */
function toRawDoc(draft: Draft) {
  return {
    name: draft.name,
    description: draft.description || undefined,
    game: draft.game || undefined,
    category: draft.category || undefined,
    tags: draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    rules: draft.rules || undefined,
    imageUrl: draft.imageUrl || undefined,
  };
}

/**
 * The organizer metadata edit form (inside the {EditTournamentButton} dialog).
 * Validates with the same Zod schema the server enforces, then signs + persists
 * via {useUpdateTournamentMetadata}. Closes the dialog via `onDone` on success;
 * on error it stays open and shows the message.
 */
export function EditTournamentForm({
  tournamentAddress,
  metadata,
  onDone,
}: {
  tournamentAddress: `0x${string}`;
  metadata: TournamentMetadataDoc | null;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(metadata));
  const [invalid, setInvalid] = useState<string | null>(null);
  const { save, saving, error } =
    useUpdateTournamentMetadata(tournamentAddress);

  function set<K extends keyof Draft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = tournamentMetadataSchema.safeParse(toRawDoc(draft));
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setInvalid(null);
    if (await save(parsed.data)) onDone();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Name">
        <Input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Winter Clash 2025"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder={"Describe your tournament\u2026"}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game">
          <Input
            value={draft.game}
            onChange={(e) => set("game", e.target.value)}
          />
        </Field>
        <Field label="Category">
          <Input
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Tags" hint="Comma-separated">
        <Input
          value={draft.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="e.g. fighting, ranked, online"
        />
      </Field>
      <Field label="Rules">
        <Textarea
          value={draft.rules}
          onChange={(e) => set("rules", e.target.value)}
          placeholder={"Match rules, conduct, tie-breakers\u2026"}
          className="min-h-32"
        />
      </Field>
      <CoverImagePicker
        value={draft.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />

      {invalid || error ? (
        <p className="text-sm text-destructive">{invalid ?? error}</p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Signing\u2026" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
