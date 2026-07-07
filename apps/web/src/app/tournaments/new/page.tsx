import { CreateTournamentWizard } from "@/features/tournaments/components/CreateTournamentWizard";

export const metadata = {
  title: "Create tournament \u2014 Arbiter",
};

export default function CreateTournamentPage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6 sm:p-12">
      <CreateTournamentWizard />
    </main>
  );
}
