import { OwnProfilePage } from "@/features/profiles/components/OwnProfilePage";

// The connected wallet lives only client-side (wagmi), so the page shell is a
// client component that reads the address and loads data via a server action.
export default function ProfilePage() {
  return <OwnProfilePage />;
}
