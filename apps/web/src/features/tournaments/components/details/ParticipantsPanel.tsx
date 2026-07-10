import type { ProfileDoc, Registration } from "@arbiter/db";
import { UserIdentity } from "@/features/profiles/components/UserIdentity";
import { getProfilesByAddresses } from "@/features/profiles/server/getProfilesByAddresses";

/**
 * Roster for the Participants tab: slots-filled counter plus the registered
 * addresses in registration order with join time. Profiles are batch-resolved
 * in a single query (no N+1) and rendered via `UserIdentity`, which falls back
 * to the generated avatar + `shortAddress` for unregistered addresses (spec 009).
 */
export async function ParticipantsPanel({
  registrations,
  maxPlayers,
}: {
  registrations: Registration[];
  maxPlayers: number;
}) {
  const addresses = registrations.map((r) => r.player);
  const profiles = await getProfilesByAddresses(addresses);

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
            <ParticipantRow
              key={row.id}
              row={row}
              profile={profiles.get(row.player.toLowerCase())}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ParticipantRow({
  row,
  profile,
}: {
  row: Registration;
  profile: ProfileDoc | undefined;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <UserIdentity
        address={row.player}
        profile={profile}
        subtitle={
          <span className="text-xs text-muted-foreground">
            Joined {row.registeredAt.toLocaleString()}
          </span>
        }
      />
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        #{row.position + 1}
      </span>
    </li>
  );
}
