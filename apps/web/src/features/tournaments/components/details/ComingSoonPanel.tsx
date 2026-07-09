/**
 * Shared honest empty state for sections whose backing data does not exist yet
 * (Bracket, Participants). Deferred to future specs; see spec 004.
 */
export function ComingSoonPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-input px-6 py-16 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
