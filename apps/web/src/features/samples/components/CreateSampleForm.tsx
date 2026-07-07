"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSample } from "../hooks/useCreateSample";

export function CreateSampleForm() {
  const { state, formAction, pending } = useCreateSample();

  return (
    <form action={formAction} className="flex gap-2">
      <Input name="name" placeholder="Sample name" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding\u2026" : "Add"}
      </Button>
      {state.error ? (
        <span className="self-center text-sm text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
