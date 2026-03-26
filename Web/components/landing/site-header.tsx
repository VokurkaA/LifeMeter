import Image from "next/image";
import { Link } from "@/components/ui/heroui";
import { logoImage } from "@/lib/marketing-assets";

type SiteHeaderProps = {
  eyebrow: string;
};

const siteHeaderLinks = [
  { href: "/", label: "Home" },
  { href: "/downloads", label: "Downloads" },
  { href: "/admin/login", label: "Admin" },
];

export function SiteHeader({ eyebrow }: SiteHeaderProps) {
  return (
    <header className="landing-frame relative flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:py-8">
      <Link className="flex items-center gap-3" href="/">
        <Image alt="LifeMeter" className="landing-logo h-11 w-11" priority src={logoImage} />
        <div>
          <p className="landing-text-strong text-lg font-semibold tracking-[0.08em]">LifeMeter</p>
          <p className="landing-text-dim text-xs uppercase tracking-[0.3em]">{eyebrow}</p>
        </div>
      </Link>

      <nav
        aria-label="Primary"
        className="landing-text-muted flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-start sm:gap-6"
      >
        {siteHeaderLinks.map((link) => (
          <Link className="landing-inline-link" href={link.href} key={`${link.label}:${link.href}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
