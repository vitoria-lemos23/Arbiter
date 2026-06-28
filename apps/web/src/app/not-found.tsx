import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-12">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you were looking for does not exist or has moved.
      </p>
      <Button asChild className="self-start">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
