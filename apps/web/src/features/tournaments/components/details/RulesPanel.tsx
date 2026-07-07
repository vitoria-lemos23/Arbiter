/**
 * Renders the free-form `rules` text. Plain text (not Markdown/HTML) with
 * preserved whitespace and line breaks; empty state when unset. See spec 004.
 */
export function RulesPanel({ rules }: { rules?: string }) {
  if (!rules) {
    return (
      <p className="rounded-xl border border-dashed border-input px-6 py-16 text-center text-sm text-muted-foreground">
        The organizer has not added rules yet.
      </p>
    );
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {rules}
    </div>
  );
}
