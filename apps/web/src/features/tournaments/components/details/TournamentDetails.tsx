import { deriveTournamentStatus } from "../../lib/tournamentStatus";
import type { TournamentListItem } from "../../server/reconcileMetadata";
import { ComingSoonPanel } from "./ComingSoonPanel";
import { EditTournamentButton } from "./EditTournamentButton";
import { JoinTournamentButton } from "./JoinTournamentButton";
import { OverviewPanel } from "./OverviewPanel";
import { RulesPanel } from "./RulesPanel";
import { TournamentHeader } from "./TournamentHeader";
import { TournamentTabs } from "./TournamentTabs";

/**
 * Server layout for one tournament: header + tabbed body. Status is derived at
 * request time from the indexed dates. Bracket/Participants are honest
 * "coming soon" empty states deferred to future specs.
 */
export function TournamentDetails({ item }: { item: TournamentListItem }) {
  const status = deriveTournamentStatus(
    item.tournament.startDate,
    item.tournament.endDate,
    new Date(),
  );

  const { tournament, metadata } = item;

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
            <JoinTournamentButton />
          </>
        }
        overview={<OverviewPanel item={item} />}
        rules={<RulesPanel rules={item.metadata?.rules} />}
        bracket={
          <ComingSoonPanel
            title="Bracket coming soon"
            description="The bracket will appear here once matches are tracked on-chain."
          />
        }
        participants={
          <ComingSoonPanel
            title="Participants coming soon"
            description="Enrollment is not open yet; participants will be listed here."
          />
        }
      />
    </main>
  );
}
