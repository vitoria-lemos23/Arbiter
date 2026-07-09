"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Client tab strip (Radix `Tabs`) laid out per the design: Bracket, Overview,
 * Participants, Rules. Overview is the default. Panels are rendered on the server
 * and passed in as nodes so this island stays purely presentational. `actions`
 * (the Join + Edit islands) share the tab strip's row.
 */
export function TournamentTabs({
  overview,
  rules,
  bracket,
  participants,
  actions,
}: {
  overview: ReactNode;
  rules: ReactNode;
  bracket: ReactNode;
  participants: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TabsList>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        {actions ? (
          <div className="flex items-start gap-3">{actions}</div>
        ) : null}
      </div>
      <TabsContent value="bracket" className="pt-4">
        {bracket}
      </TabsContent>
      <TabsContent value="overview" className="pt-4">
        {overview}
      </TabsContent>
      <TabsContent value="participants" className="pt-4">
        {participants}
      </TabsContent>
      <TabsContent value="rules" className="pt-4">
        {rules}
      </TabsContent>
    </Tabs>
  );
}
