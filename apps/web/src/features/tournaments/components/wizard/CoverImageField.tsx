"use client";

import { useController, useFormContext } from "react-hook-form";
import type { WizardValues } from "../../schema/createTournament";
import { CoverImagePicker } from "../CoverImagePicker";

/**
 * Wizard adapter that binds the shared {CoverImagePicker} to the RHF `imageUrl`
 * field. The upload + preview logic lives in the picker so the edit dialog can
 * reuse it with plain local state.
 */
export function CoverImageField() {
  const { control } = useFormContext<WizardValues>();
  const { field } = useController({ control, name: "imageUrl" });
  return <CoverImagePicker value={field.value} onChange={field.onChange} />;
}
