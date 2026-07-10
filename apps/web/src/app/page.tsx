import { MyTournamentsPage } from "@/features/tournaments/components/MyTournamentsPage";

// The dashboard reads the connected wallet client-side (wagmi) and fetches per
// request via a server action — never prerendered at build.
export const dynamic = "force-dynamic";

export default function Home() {
  return <MyTournamentsPage />;
}
