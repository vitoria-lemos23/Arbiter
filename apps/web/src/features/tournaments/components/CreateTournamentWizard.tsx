"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateTournament } from "../hooks/useCreateTournament";
import {
  collectFieldErrors,
  createTournamentSchema,
  type FieldErrors,
  firstStepWithError,
  INITIAL_WIZARD_VALUES,
  stepFieldErrors,
  WIZARD_STEPS,
  type WizardValues,
} from "../schema/createTournament";
import { Notice } from "./wizard/fields";
import { Stepper } from "./wizard/Stepper";
import {
  StepApply,
  StepFormat,
  StepName,
  StepPrize,
  StepReview,
} from "./wizard/steps";

const LAST_STEP = WIZARD_STEPS.length - 1;

/**
 * Five-step create-tournament wizard (Name → Format → Prize → Apply → Review).
 * Holds the raw form state, validates per step before advancing, and hands the
 * parsed values to {useCreateTournament} on the final "Deploy" step. All
 * wallet/tx logic lives in the hook; this component is state + presentation.
 */
export function CreateTournamentWizard() {
  const {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isPending,
    isConfirming,
    isSuccess,
    error,
    predictedAddress,
    switchNetwork,
    createTournament,
  } = useCreateTournament();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(INITIAL_WIZARD_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const idPrefix = useId();

  // Reset the whole wizard once the deploy tx is mined (temporary UX — a later
  // iteration redirects to the tournament's details page instead).
  useEffect(() => {
    if (isSuccess) {
      setValues(INITIAL_WIZARD_VALUES);
      setErrors({});
      setStep(0);
    }
  }, [isSuccess]);

  if (!isConnected) {
    return <Notice>Connect a wallet to create a tournament.</Notice>;
  }
  if (wrongChain) {
    return (
      <div className="flex flex-col gap-3">
        <Notice>This network isn’t supported. Switch to continue.</Notice>
        <Button type="button" onClick={switchNetwork} className="self-start">
          Switch network
        </Button>
      </div>
    );
  }
  if (!canSubmit) {
    return (
      <Notice tone="destructive">
        Tournament factory address is not configured. Set
        <code className="mx-1 font-mono">NEXT_PUBLIC_FACTORY_ADDRESS</code>
        to enable creation.
      </Notice>
    );
  }

  function set(field: keyof WizardValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function goNext() {
    const scoped = stepFieldErrors(step, collectFieldErrors(values));
    setErrors(scoped);
    if (Object.keys(scoped).length === 0) setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  function deploy() {
    const result = createTournamentSchema.safeParse(values);
    if (!result.success) {
      const all = collectFieldErrors(values);
      setErrors(all);
      const target = firstStepWithError(all);
      if (target >= 0) setStep(target);
      return;
    }
    setErrors({});
    createTournament(result.data);
  }

  const meta = WIZARD_STEPS[step];
  const stepProps = { idPrefix, values, errors, set };
  const deployLabel = isPending
    ? "Confirm in wallet…"
    : isConfirming
      ? "Mining…"
      : "Deploy →";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
        <span className="text-sm text-muted-foreground">
          Step {step + 1}/{WIZARD_STEPS.length}
        </span>
      </div>

      <Stepper steps={WIZARD_STEPS} current={step} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{meta.heading}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <StepName {...stepProps} />}
          {step === 1 && <StepFormat {...stepProps} />}
          {step === 2 && <StepPrize {...stepProps} />}
          {step === 3 && <StepApply {...stepProps} />}
          {step === 4 && <StepReview values={values} />}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 0 || busy}
        >
          ← Back
        </Button>
        <div className="flex-1" />
        {step === LAST_STEP ? (
          <Button type="button" onClick={deploy} disabled={busy}>
            {deployLabel}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            Continue →
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error.message.split("\n")[0]}
        </p>
      ) : null}

      {isSuccess && predictedAddress ? (
        <p className="text-sm text-primary">
          Tournament created at{" "}
          <span className="font-mono break-all">{predictedAddress}</span>
        </p>
      ) : null}
    </div>
  );
}
