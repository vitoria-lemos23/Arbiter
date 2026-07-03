import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/shared/theme/ModeToggle";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { WalletMenu } from "./WalletMenu";

/**
 * Application top bar: brand, section nav, create action, theme toggle,
 * wallet chip, and profile avatar. Rendered once from the root layout.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-5">
        <Logo />
        <MainNav className="ml-3.5 hidden md:flex" />
        <div className="flex-1" />
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/tournaments/new">
            <PlusIcon weight="bold" />
            Create
          </Link>
        </Button>
        <ModeToggle />
        <WalletMenu />
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
          aria-hidden="true"
        >
          PK
        </span>
      </div>
    </header>
  );
}
