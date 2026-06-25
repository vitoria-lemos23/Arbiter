"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSampleAction, type CreateSampleState } from "./actions";

const initialState: CreateSampleState = {};

export function CreateSampleForm() {
  const [state, formAction, pending] = useActionState(
    createSampleAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex gap-2">
      <Input name="name" placeholder="Sample name" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <span className="self-center text-sm text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}