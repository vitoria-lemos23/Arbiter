import type { Address } from "viem";
import { deriveTournamentStatus } from "../../lib/tournamentStatus";
import { listRegistrations } from "../../server/getRegistrations";
import { getTournamentResult } from "../../server/getTournamentResult";
import type { TournamentListItem } from "../../server/reconcileMetadata";
import { BracketPanel } from "./BracketPanel";

import { EditTournamentButton } from "./EditTournamentButton";
import { OverviewPanel } from "./OverviewPanel";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { RegisterLink } from "./RegisterLink";
import { RulesPanel } from "./RulesPanel";
import { TournamentHeader } from "./TournamentHeader";
import { TournamentTabs } from "./TournamentTabs";
import { WithdrawFeesButton } from "./WithdrawFeesButton";

/**
 * Server layout for one tournament: header + tabbed body. Status and the
 * indexed roster are fetched at request time. Registration is open until
 * `startDate` (status "soon"); the Bracket tab remains an honest "coming soon"
 * empty state deferred to a future spec.
 */
export async function TournamentDetails({
  item,
}: {
  item: TournamentListItem;
}) {
  const status = deriveTournamentStatus(
    item.tournament.startDate,
    item.tournament.endDate,
    new Date(),
  );

  const { tournament, metadata } = item;
  const [registrations, result] = await Promise.all([
    listRegistrations(tournament.address),
    getTournamentResult(tournament.address),
  ]);
  const isCompleted = result.champion !== null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 sm:p-12">
      <TournamentHeader item={item} status={status} />
      <TournamentTabs
        actions={
          <>
            <EditTournamentButton
              tournamentAddress={tournament.address as `0x${string}`}
              organizer={tournament.organizer}
              metadata={metadata}
            />
            <WithdrawFeesButton
              tournamentAddress={tournament.address as Address}
              organizer={tournament.organizer}
              isCompleted={isCompleted}
            />
            <RegisterLink
              tournamentAddress={tournament.address}
              isOpen={status === "soon"}
              isFull={registrations.length >= tournament.maxPlayers}
            />
          </>
        }
        overview={<OverviewPanel item={item} />}
        rules={<RulesPanel rules={item.metadata?.rules} />}
        bracket={
          <BracketPanel
            tournamentAddress={tournament.address}
            maxPlayers={tournament.maxPlayers}
            registeredCount={registrations.length}
            prizeWei={tournament.prize}
            champion={result.champion}
          />
        }
        participants={
          <ParticipantsPanel
            registrations={registrations}
            maxPlayers={tournament.maxPlayers}
          />
        }
      />
    </main>
  );
}
