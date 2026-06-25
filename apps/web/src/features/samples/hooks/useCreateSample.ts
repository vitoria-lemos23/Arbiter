"use client";

import { useActionState } from "react";
import {
  createSampleAction,
  type CreateSampleState,
} from "../actions/createSample";

const initialState: CreateSampleState = {};

/** Wraps the create-sample server action in form state (value, pending, error). */
export function useCreateSample() {
  const [state, formAction, pending] = useActionState(
    createSampleAction,
    initialState,
  );

  return { state, formAction, pending };
}
