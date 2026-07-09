import type { Registration } from "@arbiter/db";
import { shortAddress } from "../../lib/formatTournament";

/**
 * Roster for the Participants tab (replaces the ComingSoonPanel): slots-filled
 * counter plus the registered addresses in registration order with join time.
 * Reads the indexed `ponder.registration` rows, so it is eventually consistent
 * with the chain (spec 005, business rule 8). Address-only by design — player
 * metadata is deferred.
 */
export function ParticipantsPanel({
  registrations,
  maxPlayers,
}: {
  registrations: Registration[];
  maxPlayers: number;
}) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-mono font-medium text-foreground">
          {registrations.length} / {maxPlayers}
        </span>{" "}
        slots filled
      </p>
      {registrations.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-input px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No players have registered yet.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-input">
          {registrations.map((row) => (
            <ParticipantRow key={row.id} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ParticipantRow({ row }: { row: Registration }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <AddressAvatar address={row.player} />
      <div className="flex flex-col">
        <span className="font-mono text-sm">{shortAddress(row.player)}</span>
        <span className="text-xs text-muted-foreground">
          Joined {row.registeredAt.toLocaleString()}
        </span>
      </div>
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        #{row.position + 1}
      </span>
    </li>
  );
}

/** Placeholder avatar from the first two hex chars (player metadata deferred). */
function AddressAvatar({ address }: { address: string }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs uppercase text-muted-foreground"
    >
      {address.slice(2, 4)}
    </span>
  );
}
