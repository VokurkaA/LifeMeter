import type { Metadata } from "next";
import {
  Archive,
  ArrowRight,
  Download,
  Smartphone,
} from "lucide-react";
import { PlatformReleaseCard } from "@/components/releases/platform-release-card";
import { ReleaseArchiveList } from "@/components/releases/release-archive-list";
import {
  Card,
  CardDescription,
  CardHeader,
  Chip,
  Link,
  Surface,
} from "@/components/ui/heroui";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getPlatformReleaseState } from "@/lib/releases";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LifeMeter | Downloads",
  description:
    "Install the latest LifeMeter mobile build or pick a versioned release with publish time and commit context.",
};

const downloadsFooterLinks = [
  { href: "/", label: "Homepage" },
  { href: "#release-lanes", label: "Release lanes" },
  { href: "#android-archive", label: "Android archive" },
  { href: "/admin/login", label: "Admin console" },
];

export default async function DownloadsPage() {
  const [androidReleaseState, iosReleaseState] = await Promise.all([
    getPlatformReleaseState("android"),
    getPlatformReleaseState("ios"),
  ]);

  const liveTracks =
    Number(Boolean(androidReleaseState.latest)) + Number(Boolean(iosReleaseState.latest));

  const heroBadge = androidReleaseState.latest
    ? `Android v${androidReleaseState.latest.version} live`
    : "Release desk ready";
  const heroSupportCopy = androidReleaseState.latest
    ? "Current install path is live, and version history is still one click away."
    : "Stable latest routes and versioned archives are already wired, so the first release lands in a real download desk.";

  const primaryHeroAction = androidReleaseState.latest
    ? {
        href: androidReleaseState.latestDownloadPath,
        label: `Install Android v${androidReleaseState.latest.version}`,
      }
    : {
        href: "#release-lanes",
        label: "Check release lanes",
      };

  const secondaryHeroAction = androidReleaseState.releases.length
    ? {
        href: "#android-archive",
        label: "Browse version history",
      }
    : {
        href: "/",
        label: "Back to homepage",
      };

  const heroChecklist = [
    "Use one stable route for the newest install.",
    "Drop into the archive when the exact version matters.",
    "Keep version, commit, publish time, and size beside the file.",
  ];

  const heroSpotlightStatus = androidReleaseState.latest
    ? "Live route"
    : androidReleaseState.status === "unconfigured"
      ? "Waiting on storage"
      : "Waiting on first build";
  const heroSpotlightTitle = androidReleaseState.latest
    ? `Android v${androidReleaseState.latest.version} is the current install path.`
    : "Android latest route is ready for the first live build.";
  const heroSpotlightBody = androidReleaseState.latest
    ? `The stable route resolves to the newest Android build, published ${formatDateTime(
        androidReleaseState.latest.builtAt,
      )}.`
    : androidReleaseState.message;
  const heroSpotlightMetrics = androidReleaseState.latest
    ? [
        {
          label: "Published",
          value: formatDateTime(androidReleaseState.latest.builtAt),
        },
        {
          label: "Commit",
          value: androidReleaseState.latest.shortCommitSha,
        },
        {
          label: "Archive",
          value: `${formatNumber(androidReleaseState.releases.length)} builds`,
        },
      ]
    : [
        {
          label: "Latest route",
          value: androidReleaseState.status === "unconfigured" ? "Waiting" : "Ready",
        },
        {
          label: "Android archive",
          value: `${formatNumber(androidReleaseState.releases.length)} builds`,
        },
        {
          label: "Live tracks",
          value: `${liveTracks}/2`,
        },
      ];

  const heroSupportCards = [
    {
      title: "Android archive",
      value: `${formatNumber(androidReleaseState.releases.length)} builds`,
      body:
        androidReleaseState.releases.length > 0
          ? "Versioned APKs stay visible for rollback, QA, and device-specific checks."
          : "The first Android build will anchor the archive here.",
      href: "#android-archive",
      actionLabel: "Open archive",
    },
    {
      title: "iOS lane",
      value: iosReleaseState.latest
        ? `v${iosReleaseState.latest.version}`
        : iosReleaseState.status === "unconfigured"
          ? "Not configured"
          : "Reserved",
      body: iosReleaseState.latest
        ? `Latest iOS route is also live and published ${formatDateTime(iosReleaseState.latest.builtAt)}.`
        : iosReleaseState.message,
      href: "#ios-archive",
      actionLabel: "See iOS lane",
    },
  ];

  const releaseSteps = [
    {
      index: "01",
      title: "Use the stable route when speed matters.",
      body:
        "If you just need the newest build, install from the latest route and skip the decision overhead.",
      detail: androidReleaseState.latestDownloadPath,
      note: androidReleaseState.latest
        ? `Right now that route points to Android v${androidReleaseState.latest.version}.`
        : "That route is already part of the release shape and will activate with the first Android build.",
    },
    {
      index: "02",
      title: "Drop into the archive when the version matters.",
      body:
        "Use the versioned list for rollback drills, regression hunts, or device checks where the exact file matters.",
      detail:
        androidReleaseState.releases.length > 0
          ? `${formatNumber(androidReleaseState.releases.length)} Android builds currently listed.`
          : "The archive will fill automatically as builds are published.",
      note: "The archive keeps older files visible instead of forcing people to recover them from CI history.",
    },
    {
      index: "03",
      title: "Verify the release context before you install.",
      body:
        "Each build stays tied to version, commit, publish time, and size so you can confirm what you are about to test.",
      detail: androidReleaseState.latest
        ? `Latest Android commit ${androidReleaseState.latest.shortCommitSha}`
        : "Release metadata appears beside each file as soon as a build is live.",
      note: "The page works like a release desk, not a blind file listing.",
    },
  ];

  const androidLaneNote = androidReleaseState.latest
    ? "Install the newest APK from the stable route, or step into the archive when a specific Android version matters."
    : "The Android lane is fully wired and waiting for the first published build.";
  const iosLaneNote = iosReleaseState.latest
    ? "The iOS lane uses the same versioned shape, so testers can move between latest and archived builds without a new flow."
    : iosReleaseState.status === "unconfigured"
      ? "The iOS slot exists, but storage is not configured yet, so the first build still needs its delivery path."
      : "The iOS lane is reserved and will fill with the first published build.";

  const androidArchiveDescription = androidReleaseState.releases.length
    ? "Older Android builds stay one click away for rollback, regression, and device-specific installs."
    : "The Android archive will populate here as soon as the first APK is published.";
  const iosArchiveDescription = iosReleaseState.releases.length
    ? "Every iOS build keeps the same versioned context and direct download path."
    : iosReleaseState.status === "unconfigured"
      ? "The iOS lane is reserved, but storage is not configured yet."
      : "The iOS lane is reserved and will fill when the first build is published.";

  return (
    <div className="landing-shell">
      <SiteHeader eyebrow="Downloads center" />

      <main className="relative space-y-18 pb-8 pt-8 sm:space-y-24 sm:pb-12 sm:pt-12 md:space-y-28 md:pb-14 md:pt-14 lg:space-y-32 lg:pt-16">
        <section className="landing-frame landing-section">
          <Surface className="landing-panel-hero p-5 sm:p-9 md:p-11 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:items-start lg:gap-12 xl:gap-16">
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  <Chip className="landing-beta-chip" color="accent" variant="soft">
                    {heroBadge}
                  </Chip>
                  <p className="landing-chip-copy">{heroSupportCopy}</p>
                </div>

                <div className="space-y-5">
                  <h1 className="landing-display landing-text-strong max-w-4xl text-[2.95rem] leading-[0.92] text-balance sm:text-[3.8rem] md:text-[4.7rem] lg:text-[5.15rem]">
                    Get the current build fast.
                    <span className="landing-highlight block">Keep rollback one click away.</span>
                  </h1>
                  <p className="landing-text-muted max-w-2xl text-base leading-8 sm:text-lg sm:leading-9">
                    The latest route is for today&apos;s install. The archive is for the exact
                    version you need when QA, regression work, or device testing cannot afford
                    guesswork.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <Link
                    className="landing-button-primary w-full justify-center sm:w-auto"
                    href={primaryHeroAction.href}
                  >
                    {primaryHeroAction.label}
                    <Download className="h-4 w-4" />
                  </Link>
                  <Link
                    className="landing-button-secondary w-full justify-center sm:w-auto"
                    href={secondaryHeroAction.href}
                  >
                    {secondaryHeroAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <Surface className="landing-panel-soft p-5 sm:p-6">
                  <div className="space-y-4">
                    <p className="landing-kicker">What this page handles</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {heroChecklist.map((item) => (
                        <div className="landing-point" key={item}>
                          <span className="landing-point-dot" />
                          <p className="landing-text-low text-sm leading-6">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Surface>
              </div>

              <div className="space-y-4">
                <Surface className="landing-panel p-5 sm:p-6 lg:p-7">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="landing-kicker">Current install path</p>
                        <h2 className="landing-text-strong text-[1.7rem] leading-tight sm:text-[2rem]">
                          {heroSpotlightTitle}
                        </h2>
                      </div>
                      <Chip className="landing-beta-chip" color="accent" variant="soft">
                        {heroSpotlightStatus}
                      </Chip>
                    </div>

                    <p className="landing-text-low text-sm leading-6 sm:text-base">
                      {heroSpotlightBody}
                    </p>

                    <div className="rounded-[1.4rem] border border-white/10 bg-black/10 px-4 py-4">
                      <p className="landing-text-dim text-[0.72rem] uppercase tracking-[0.22em]">
                        Stable route
                      </p>
                      <p className="landing-text-strong mt-2 font-mono text-sm leading-6 break-all">
                        {androidReleaseState.latestDownloadPath}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {heroSpotlightMetrics.map((metric) => (
                        <div
                          className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3"
                          key={metric.label}
                        >
                          <p className="landing-text-dim text-[0.72rem] uppercase tracking-[0.22em]">
                            {metric.label}
                          </p>
                          <p className="landing-text-soft mt-2 text-sm leading-6">
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        className="landing-inline-link inline-flex items-center gap-2 text-sm"
                        href={primaryHeroAction.href}
                      >
                        {androidReleaseState.latest ? "Use current install path" : "See Android lane"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        className="landing-inline-link inline-flex items-center gap-2 text-sm"
                        href={secondaryHeroAction.href}
                      >
                        {androidReleaseState.releases.length ? "See version history" : "Back to homepage"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Surface>

                <div className="grid gap-4 sm:grid-cols-2">
                  {heroSupportCards.map((card) => (
                    <Card className="landing-proof-tile" key={card.title}>
                      <CardHeader className="gap-3 p-5">
                        <p className="landing-text-dim text-[0.72rem] uppercase tracking-[0.22em]">
                          {card.title}
                        </p>
                        <p className="landing-text-strong text-xl font-semibold leading-tight sm:text-2xl">
                          {card.value}
                        </p>
                        <CardDescription className="landing-text-low text-sm leading-6">
                          {card.body}
                        </CardDescription>
                        <Link
                          className="landing-inline-link inline-flex items-center gap-2 text-sm"
                          href={card.href}
                        >
                          {card.actionLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Surface>
        </section>

        <section className="landing-frame landing-section" id="release-lanes">
          <div className="space-y-6">
            <div className="max-w-3xl space-y-3">
              <p className="landing-kicker">Release lanes</p>
              <h2 className="landing-display landing-text-strong text-[2rem] leading-tight text-balance sm:text-[2.85rem] md:text-[3.45rem]">
                Pick the lane you need, then choose speed or certainty.
              </h2>
              <p className="landing-text-soft text-base leading-8 sm:text-lg">
                Latest routes are for current installs. Versioned archives are for exact builds.
                Both lanes stay in one view so the decision is obvious.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <PlatformReleaseCard
                className="h-full"
                note={androidLaneNote}
                primaryAction={
                  androidReleaseState.latest
                    ? {
                        href: androidReleaseState.latestDownloadPath,
                        label: `Download Android v${androidReleaseState.latest.version}`,
                      }
                    : undefined
                }
                secondaryAction={{
                  href: "#android-archive",
                  label: "Browse Android archive",
                  variant: "secondary",
                }}
                state={androidReleaseState}
              />
              <PlatformReleaseCard
                className="h-full"
                note={iosLaneNote}
                primaryAction={
                  iosReleaseState.latest
                    ? {
                        href: iosReleaseState.latestDownloadPath,
                        label: `Download iOS v${iosReleaseState.latest.version}`,
                      }
                    : undefined
                }
                secondaryAction={{
                  href: "#ios-archive",
                  label: iosReleaseState.releases.length ? "Browse iOS archive" : "Check iOS lane",
                  variant: "secondary",
                }}
                state={iosReleaseState}
              />
            </div>
          </div>
        </section>

        <section className="landing-frame landing-section">
          <Surface className="landing-panel p-5 sm:p-8 md:p-10 lg:p-11">
            <div className="space-y-6">
              <div className="max-w-3xl space-y-3">
                <p className="landing-kicker">Install flow</p>
                <h2 className="landing-display landing-text-strong text-[2rem] leading-tight text-balance sm:text-[2.85rem] md:text-[3.45rem]">
                  The page tells you which file to use before you click.
                </h2>
                <p className="landing-text-soft text-base leading-8 sm:text-lg">
                  The newest install path stays obvious, the rollback path stays visible, and the
                  release context stays attached to each file.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {releaseSteps.map((step) => (
                  <div className="landing-step" key={step.index}>
                    <div className="landing-step-index">{step.index}</div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="landing-text-strong text-lg font-semibold leading-tight">
                          {step.title}
                        </p>
                        <p className="landing-text-low text-sm leading-6">{step.body}</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3">
                        <p className="landing-text-dim text-[0.72rem] uppercase tracking-[0.22em]">
                          Release signal
                        </p>
                        <p className="landing-text-soft mt-2 font-mono text-sm leading-6 break-all">
                          {step.detail}
                        </p>
                      </div>
                      <p className="landing-text-faint text-sm leading-6">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </section>

        <section className="landing-frame landing-section">
          <div className="max-w-3xl space-y-3">
            <p className="landing-kicker">Version history</p>
            <h2 className="landing-display landing-text-strong text-[2rem] leading-tight text-balance sm:text-[2.85rem] md:text-[3.45rem]">
              Keep rollback, QA, and current installs in the same release desk.
            </h2>
            <p className="landing-text-soft text-base leading-8 sm:text-lg">
              Latest links are for speed. Archives are for certainty. Both belong on the same page.
            </p>
          </div>
        </section>

        <section className="landing-frame landing-section">
          <div className="grid gap-6 xl:grid-cols-2">
            <div id="android-archive">
              <ReleaseArchiveList
                description={androidArchiveDescription}
                emptyMessage={androidReleaseState.message}
                releases={androidReleaseState.releases}
                title="Android archive"
              />
            </div>

            <div id="ios-archive">
              <ReleaseArchiveList
                description={iosArchiveDescription}
                emptyMessage={iosReleaseState.message}
                releases={iosReleaseState.releases}
                title="iOS archive"
              />
            </div>
          </div>
        </section>

        <section className="landing-frame landing-section">
          <Surface className="landing-panel-soft p-5 sm:p-7 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="landing-icon-wrap">
                    <Smartphone className="landing-text-bright h-5 w-5" />
                  </div>
                  <Chip className="landing-beta-chip" color="accent" variant="soft">
                    Release discipline
                  </Chip>
                </div>
                <h2 className="landing-display landing-text-strong text-[1.9rem] leading-tight text-balance sm:text-[2.4rem]">
                  One link for the current build. One archive for every known version.
                </h2>
                <p className="landing-text-soft max-w-2xl text-base leading-8">
                  That is the whole promise of the downloads page: get people to the right file
                  fast, and make the fallback path obvious when the exact version matters.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  className="landing-button-primary w-full justify-center sm:w-auto"
                  href={primaryHeroAction.href}
                >
                  {primaryHeroAction.label}
                  <Download className="h-4 w-4" />
                </Link>
                <Link className="landing-button-secondary w-full justify-center sm:w-auto" href="#android-archive">
                  Open archives
                  <Archive className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Surface>
        </section>
      </main>

      <SiteFooter
        description="The public download desk keeps the newest mobile build easy to install and older versions easy to recover when exact release context matters."
        links={downloadsFooterLinks}
      />
    </div>
  );
}
