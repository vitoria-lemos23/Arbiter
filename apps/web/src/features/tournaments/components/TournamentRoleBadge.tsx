import { Badge } from "@/components/ui/badge";
import type { MyTournamentRole } from "../actions/listMyTournaments";

/**
 * One role badge for the "My Tournaments" cards (#008). Variant per role is
 * fixed by the design: organizer is the primary emphasis, judge secondary,
 * player an outline.
 */
const ROLE_VARIANT: Record<
  MyTournamentRole,
  "default" | "secondary" | "outline"
> = {
  organizer: "default",
  judge: "secondary",
  player: "outline",
};

const ROLE_LABEL: Record<MyTournamentRole, string> = {
  organizer: "ORGANIZER",
  judge: "JUDGE",
  player: "PLAYER",
};

export function TournamentRoleBadge({ role }: { role: MyTournamentRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABEL[role]}</Badge>;
}
