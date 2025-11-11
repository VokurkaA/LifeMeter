import React from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl flex h-14 items-center gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight text-sm md:text-base">LifeMeter</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/foods" className="text-foreground/80 hover:text-foreground transition-colors">Foods</Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Sign up</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
