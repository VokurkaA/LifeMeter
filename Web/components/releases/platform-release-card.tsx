import { ArrowRight, Download } from "lucide-react";
import { formatDateTime, formatFileSize } from "@/lib/format";
import type { PlatformReleaseState } from "@/lib/releases";
import { Card, CardDescription, CardHeader, Chip, Link } from "@/components/ui/heroui";

export type ReleaseCardAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PlatformReleaseCardProps = {
  state: PlatformReleaseState;
  className?: string;
  note?: string;
  primaryAction?: ReleaseCardAction;
  secondaryAction?: ReleaseCardAction;
};

function getStatusCopy(state: PlatformReleaseState) {
  if (state.latest) {
    return {
      badge: "Latest ready",
      title: `v${state.latest.version}`,
      description: `Current ${state.label.toLowerCase()} build published ${formatDateTime(
        state.latest.builtAt,
      )}.`,
    };
  }

  if (state.platform === "ios") {
    return {
      badge: "Coming soon",
      title: "iOS track in progress",
      description: state.message,
    };
  }

  return {
    badge: "Unavailable",
    title: "No live build yet",
    description: state.message,
  };
}

function getActionClassName(variant: ReleaseCardAction["variant"]) {
  return variant === "secondary" ? "landing-button-secondary" : "landing-button-primary";
}

export function PlatformReleaseCard({
  state,
  className,
  note,
  primaryAction,
  secondaryAction,
}: PlatformReleaseCardProps) {
  const statusCopy = getStatusCopy(state);
  const combinedClassName = ["landing-proof-tile", className].filter(Boolean).join(" ");

  return (
    <Card className={combinedClassName}>
      <CardHeader className="gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="landing-text-dim text-xs uppercase tracking-[0.24em]">{state.label}</p>
            <p className="landing-text-strong text-xl font-semibold leading-tight sm:text-2xl">
              {statusCopy.title}
            </p>
            <CardDescription className="landing-text-low max-w-xl text-sm leading-6">
              {statusCopy.description}
            </CardDescription>
          </div>
          <Chip className="landing-beta-chip" color="accent" variant="soft">
            {statusCopy.badge}
          </Chip>
        </div>

        {state.latest ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">Published</p>
              <p className="landing-text-soft mt-2 text-sm leading-6">
                {formatDateTime(state.latest.builtAt)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">Commit</p>
              <p className="landing-text-soft mt-2 text-sm leading-6">
                {state.latest.shortCommitSha}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">Size</p>
              <p className="landing-text-soft mt-2 text-sm leading-6">
                {formatFileSize(state.latest.size)}
              </p>
            </div>
          </div>
        ) : null}

        {note ? <p className="landing-text-faint text-sm leading-6">{note}</p> : null}

        {primaryAction || secondaryAction ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {primaryAction ? (
              <Link
                className={`${getActionClassName(primaryAction.variant)} w-full justify-center sm:w-auto`}
                href={primaryAction.href}
              >
                {primaryAction.label}
                <Download className="h-4 w-4" />
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                className={`${getActionClassName(secondaryAction.variant)} w-full justify-center sm:w-auto`}
                href={secondaryAction.href}
              >
                {secondaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
    </Card>
  );
}
