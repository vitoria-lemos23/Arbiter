import type { Icon } from "@phosphor-icons/react";
import {
  GavelIcon,
  GhostIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { MyTournamentsTab } from "./MyTournamentsList";

/**
 * Per-tab empty state for the "My Tournaments" dashboard (#008). Each tab has
 * its own copy and call-to-action so a wallet with, say, no judged tournaments
 * still gets a meaningful prompt rather than a generic blank.
 */
type EmptyContent = {
  Icon: Icon;
  message: string;
  cta?: { label: string; href: string };
};

const CONTENT: Record<MyTournamentsTab, EmptyContent> = {
  all: {
    Icon: GhostIcon,
    message: "You haven't joined any tournaments yet.",
    cta: { label: "Discover tournaments", href: "/discover" },
  },
  organizer: {
    Icon: PlusIcon,
    message: "You haven't created any tournaments yet.",
    cta: { label: "Create tournament", href: "/tournaments/new" },
  },
  judge: {
    Icon: GavelIcon,
    message: "You haven't been assigned as a judge yet.",
  },
  player: {
    Icon: UsersThreeIcon,
    message: "You haven't registered for any tournaments yet.",
    cta: { label: "Discover tournaments", href: "/discover" },
  },
};

export function MyTournamentsEmptyState({ tab }: { tab: MyTournamentsTab }) {
  const { Icon, message, cta } = CONTENT[tab];
  return (
    <div className="grid place-items-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {cta ? (
        <Button asChild variant="outline">
          <Link href={cta.href}>
            {tab === "all" || tab === "player" ? (
              <MagnifyingGlassIcon />
            ) : (
              <PlusIcon />
            )}
            {cta.label}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
