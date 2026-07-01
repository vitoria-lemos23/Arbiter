import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTournamentForm } from "@/features/tournaments/components/CreateTournamentForm";

export const metadata = {
  title: "Create tournament — Arbiter",
};

export default function CreateTournamentPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-12">
      <Card>
        <CardHeader>
          <CardTitle>Create a tournament</CardTitle>
          <CardDescription>
            Deploy an on-chain tournament and deposit its prize. You’ll sign the
            transaction with your connected wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTournamentForm />
        </CardContent>
      </Card>
    </main>
  );
}
