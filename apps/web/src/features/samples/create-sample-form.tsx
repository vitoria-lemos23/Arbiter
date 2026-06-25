"use client";

import { useActionState } from "react";
import { createSampleAction, type CreateSampleState } from "./actions";

const initialState: CreateSampleState = {};

export function CreateSampleForm() {
  const [state, formAction, pending] = useActionState(
    createSampleAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="name"
        placeholder="Sample name"
        className="border rounded px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state.error ? (
        <span className="self-center text-sm text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}