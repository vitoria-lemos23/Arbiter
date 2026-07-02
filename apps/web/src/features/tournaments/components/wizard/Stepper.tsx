import { cn } from "@/lib/utils";

/**
 * Horizontal progress rail for the create wizard. Completed steps show a check
 * on a lime node with a lime connector; the current step is a lime node with
 * its number; upcoming steps are outlined and muted.
 */
export function Stepper({
  steps,
  current,
}: {
  steps: readonly { title: string }[];
  current: number;
}) {
  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.title}
            className={cn(
              "flex items-center",
              index < steps.length - 1 && "flex-1",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  done || active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground",
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  done || active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "mx-3 h-0.5 flex-1 rounded-full",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
