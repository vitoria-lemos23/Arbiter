"use client";

import { useActionState } from "react";
import {
  incrementCounterAction,
  type IncrementCounterState,
} from "./actions";

const initialState: IncrementCounterState = {};

export function IncrementCounterForm() {
  const [state, formAction, pending] = useActionState(
    incrementCounterAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="by"
        type="number"
        min={1}
        defaultValue={1}
        className="border rounded px-3 py-1.5 text-sm w-24"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Incrementing…" : "Increment"}
      </button>
      {state.error ? (
        <span className="self-center text-sm text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}