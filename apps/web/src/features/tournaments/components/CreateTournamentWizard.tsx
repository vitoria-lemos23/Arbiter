"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useState } from "react";
import { type Path, type Resolver, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useCreateTournament } from "../hooks/useCreateTournament";
import {
  createTournamentSchema,
  firstStepWithError,
  INITIAL_WIZARD_VALUES,
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

// The schema coerces string inputs to typed output, so its parsed type differs
// from the raw all-string form values; cast the resolver to the form's shape.
// (Standard Schema resolver — zod 4 implements the `~standard` spec.)
const resolver = standardSchemaResolver(
  createTournamentSchema,
) as unknown as Resolver<WizardValues>;

/**
 * Five-step create-tournament wizard (Name → Format → Prize → Apply → Review).
 * React Hook Form owns the raw string form state and per-field validation
 * (Zod resolver); each step validates its own fields before advancing. The
 * parsed values are handed to {useCreateTournament} on the final "Deploy" step.
 */
export function CreateTournamentWizard() {
  const {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isSavingMetadata,
    isPending,
    isConfirming,
    isSuccess,
    error,
    metadataError,
    predictedAddress,
    switchNetwork,
    createTournament,
    reset,
  } = useCreateTournament();

  const [step, setStep] = useState(0);
  const form = useForm<WizardValues>({
    resolver,
    defaultValues: INITIAL_WIZARD_VALUES,
    mode: "onTouched",
  });

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

  // Success screen instead of resetting the form in an effect — the reset only
  // happens on the explicit "Create another" click (a later iteration will
  // redirect to the tournament's details page instead).
  if (isSuccess && predictedAddress) {
    return (
      <SuccessCard
        address={predictedAddress}
        onReset={() => {
          reset();
          form.reset(INITIAL_WIZARD_VALUES);
          setStep(0);
        }}
      />
    );
  }

  async function goNext() {
    const fields = [...WIZARD_STEPS[step].fields] as Path<WizardValues>[];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => Math.min(LAST_STEP, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  const deploy = form.handleSubmit(
    // Valid: re-parse to the coerced on-chain shape and submit.
    () => createTournament(createTournamentSchema.parse(form.getValues())),
    // Invalid: jump back to the earliest step that owns a failing field.
    (errors) => {
      const target = firstStepWithError(errors);
      if (target >= 0) setStep(target);
    },
  );

  const meta = WIZARD_STEPS[step];
  const deployLabel = isSavingMetadata
    ? "Sign to save details…"
    : isPending
      ? "Confirm in wallet…"
      : isConfirming
        ? "Mining…"
        : "Deploy →";

  return (
    <Form {...form}>
      <form onSubmit={deploy} className="flex flex-col gap-6" noValidate>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Tournament
          </h1>
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
            {step === 0 && <StepName />}
            {step === 1 && <StepFormat />}
            {step === 2 && <StepPrize />}
            {step === 3 && <StepApply />}
            {step === 4 && <StepReview />}
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
            <Button type="submit" disabled={busy}>
              {deployLabel}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Continue →
            </Button>
          )}
        </div>

        {metadataError ? (
          <p className="text-sm text-destructive">{metadataError}</p>
        ) : error ? (
          <p className="text-sm text-destructive">
            {error.message.split("\n")[0]}
          </p>
        ) : null}
      </form>
    </Form>
  );
}

/** Post-deploy confirmation with the mined clone address. */
function SuccessCard({
  address,
  onReset,
}: {
  address: string;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tournament created 🎉</CardTitle>
        <CardDescription>
          Your tournament is live at{" "}
          <span className="font-mono break-all text-primary">{address}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onReset}>
          Create another
        </Button>
      </CardContent>
    </Card>
  );
}
