"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  MyTournament,
  MyTournamentRole,
} from "../actions/listMyTournaments";
import { MyTournamentsEmptyState } from "./MyTournamentsEmptyState";
import { TournamentCard } from "./TournamentCard";

/** Dashboard filter tabs: the aggregate view plus one per role. */
export type MyTournamentsTab = "all" | MyTournamentRole;

const TABS: { value: MyTournamentsTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "organizer", label: "Organizer" },
  { value: "judge", label: "Judge" },
  { value: "player", label: "Player" },
];

/**
 * Role tabs are independent filters: each shows the subset where the wallet
 * holds that specific role, so a multi-role tournament appears in every
 * matching tab (business rule 3). "All" is the unique-tournament view.
 */
function filterByTab(
  items: MyTournament[],
  tab: MyTournamentsTab,
): MyTournament[] {
  if (tab === "all") return items;
  return items.filter((item) => item.roles.includes(tab));
}

export function MyTournamentsList({ items }: { items: MyTournament[] }) {
  const [tab, setTab] = useState<MyTournamentsTab>("all");
  const visible = filterByTab(items, tab);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as MyTournamentsTab)}
    >
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* Single content pane keyed to the active tab — the filtered grid is the
          same shape for every role, so per-tab panes would only duplicate it. */}
      <TabsContent value={tab} className="pt-2">
        {visible.length === 0 ? (
          <MyTournamentsEmptyState tab={tab} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <TournamentCard key={item.tournament.address} item={item} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
