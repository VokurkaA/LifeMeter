import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Download } from "lucide-react";
import logoImage from "../../../App/src/assets/logo.png";
import { PlatformReleaseCard } from "@/components/releases/platform-release-card";
import { ReleaseArchiveList } from "@/components/releases/release-archive-list";
import { Chip, Link, Surface } from "@/components/ui/heroui";
import { getPlatformReleaseState } from "@/lib/releases";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LifeMeter | Downloads",
  description:
    "Download the latest LifeMeter mobile builds and browse previous release versions.",
};

export default async function DownloadsPage() {
  const [androidReleaseState, iosReleaseState] = await Promise.all([
    getPlatformReleaseState("android"),
    getPlatformReleaseState("ios"),
  ]);

  return (
    <div className="landing-shell">
      <header className="landing-frame relative flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:py-8">
        <Link className="flex items-center gap-3" href="/">
          <Image alt="LifeMeter" className="landing-logo h-11 w-11" priority src={logoImage} />
          <div>
            <p className="landing-text-strong text-lg font-semibold tracking-[0.08em]">LifeMeter</p>
            <p className="landing-text-dim text-xs uppercase tracking-[0.3em]">
              Downloads center
            </p>
          </div>
        </Link>

        <nav
          aria-label="Downloads"
          className="landing-text-muted flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-start sm:gap-6"
        >
          <Link className="landing-inline-link" href="/">
            Home
          </Link>
          {androidReleaseState.latest ? (
            <Link className="landing-inline-link" href="/downloads/android/latest">
              Android latest
            </Link>
          ) : null}
          <Link className="landing-inline-link" href="#ios-archive">
            iOS status
          </Link>
          <Link className="landing-inline-link" href="/admin/login">
            Admin
          </Link>
        </nav>
      </header>

      <main className="relative space-y-18 pb-8 pt-8 sm:space-y-24 sm:pb-12 sm:pt-12 md:space-y-28 md:pb-14 md:pt-14 lg:space-y-32 lg:pt-16">
        <section className="landing-frame landing-section">
          <Surface className="landing-panel-hero p-5 sm:p-9 md:p-11 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1.12fr)] lg:items-start lg:gap-12">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Chip className="landing-beta-chip" color="accent" variant="soft">
                    Versioned downloads
                  </Chip>
                  <p className="landing-chip-copy">
                    Keep the install path short for the latest build and the rollback path visible
                    when an older version matters.
                  </p>
                </div>

                <div className="space-y-5">
                  <h1 className="landing-display landing-text-strong max-w-4xl text-[2.8rem] leading-[0.94] text-balance sm:text-[3.6rem] md:text-[4.4rem] lg:text-[4.8rem]">
                    Current mobile builds and release history in one place.
                  </h1>
                  <p className="landing-text-soft max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
                    `/downloads/&lt;os&gt;/latest` stays stable for the newest release. The archive
                    below keeps older builds visible, downloadable, and tied to a version and
                    commit.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  {androidReleaseState.latest ? (
                    <Link
                      className="landing-button-primary w-full justify-center sm:w-auto"
                      href={androidReleaseState.latestDownloadPath}
                    >
                      Download latest Android
                      <Download className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <Link className="landing-button-secondary w-full justify-center sm:w-auto" href="/">
                    Back to homepage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <PlatformReleaseCard
                  state={androidReleaseState}
                  note="Each Android artifact stays versioned by file name, while the stable latest route keeps the install link short."
                  primaryAction={
                    androidReleaseState.latest
                      ? {
                          href: androidReleaseState.latestDownloadPath,
                          label: `Download Android v${androidReleaseState.latest.version}`,
                        }
                      : undefined
                  }
                />
                <PlatformReleaseCard
                  state={iosReleaseState}
                  note="The iOS lane already has the same route shape and version slot, so the first published release will appear here without another UI rewrite."
                />
              </div>
            </div>
          </Surface>
        </section>

        <section className="landing-frame landing-section">
          <ReleaseArchiveList
            description="Older Android builds stay one click away."
            emptyMessage="Publish an Android build and it will appear here automatically."
            releases={androidReleaseState.releases}
            title="Android archive"
          />
        </section>

        <section className="landing-frame landing-section" id="ios-archive">
          <ReleaseArchiveList
            description="The iOS lane is reserved and will fill when the first build is published."
            emptyMessage="No iOS build has been published yet."
            releases={iosReleaseState.releases}
            title="iOS archive"
          />
        </section>
      </main>
    </div>
  );
}
