import Image from "next/image";
import { Link } from "@/components/ui/heroui";
import { logoImage } from "@/lib/marketing-assets";

type SiteFooterLink = {
  href: string;
  label: string;
};

type SiteFooterProps = {
  links: SiteFooterLink[];
  description?: string;
};

const defaultDescription =
  "A focused mobile health companion for people who want one daily signal instead of a stack of disconnected tools.";

export function SiteFooter({
  links,
  description = defaultDescription,
}: SiteFooterProps) {
  return (
    <footer className="landing-divider landing-frame relative mt-16 border-t py-10 md:mt-24 lg:py-14">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image alt="LifeMeter" className="landing-logo h-10 w-10" src={logoImage} />
            <div>
              <p className="landing-text-strong text-base font-semibold tracking-[0.08em]">
                LifeMeter
              </p>
              <p className="landing-text-ghost text-xs uppercase tracking-[0.28em]">
                Training, meals, sleep, progress
              </p>
            </div>
          </div>
          <p className="landing-text-faint max-w-xl text-sm leading-7">{description}</p>
        </div>

        <div className="landing-text-soft flex flex-wrap gap-3 text-sm md:justify-end">
          {links.map((link) => (
            <Link className="landing-nav-link" href={link.href} key={`${link.label}:${link.href}`}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
