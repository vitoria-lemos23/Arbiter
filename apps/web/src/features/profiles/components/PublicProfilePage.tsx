import type { ProfileDoc } from "@arbiter/db";
import type { PlayedTournament } from "../server/getPlayedTournaments";
import { EditProfileLink } from "./EditProfileLink";
import { PlayedTournamentsList } from "./PlayedTournamentsList";
import { ProfileHeader } from "./ProfileHeader";

/**
 * Read-only public profile at `/profile/[address]` (spec 009): avatar, display
 * name (or truncated address), copyable address, and the address's played
 * tournaments. Any visitor can view it; an "Edit profile" link appears only
 * when the connected wallet is the subject. Profile data is public.
 */
export function PublicProfilePage({
  address,
  profile,
  played,
}: {
  address: string;
  profile: ProfileDoc | null;
  played: PlayedTournament[];
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 sm:p-12">
      <ProfileHeader
        address={address}
        profile={profile}
        action={<EditProfileLink address={address} />}
      />
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Played tournaments</h2>
        <PlayedTournamentsList played={played} />
      </section>
    </main>
  );
}
