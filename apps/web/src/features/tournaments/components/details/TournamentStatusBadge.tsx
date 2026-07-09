import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TOURNAMENT_STATUS_LABEL,
  type TournamentStatus,
} from "../../lib/tournamentStatus";

// LIVE uses the lime accent (the theme `primary`); Soon/Finished stay muted.
const STATUS_STYLES: Record<TournamentStatus, string> = {
  soon: "bg-muted text-muted-foreground",
  live: "bg-primary text-primary-foreground",
  finished: "bg-secondary text-secondary-foreground",
};

/** Renders Soon / LIVE / Finished from a derived {TournamentStatus}. */
export function TournamentStatusBadge({
  status,
}: {
  status: TournamentStatus;
}) {
  return (
    <Badge className={cn("tracking-wide", STATUS_STYLES[status])}>
      {TOURNAMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
