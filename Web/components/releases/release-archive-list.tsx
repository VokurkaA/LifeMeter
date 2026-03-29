import { Download } from "lucide-react";
import { formatDateTime, formatFileSize } from "@/lib/format";
import type { ReleaseRecord } from "@/lib/releases";
import {
  Card,
  CardDescription,
  CardHeader,
  Chip,
  Link,
  Surface,
} from "@/components/ui/heroui";

type ReleaseArchiveListProps = {
  title: string;
  description: string;
  releases: ReleaseRecord[];
  emptyMessage: string;
};

export function ReleaseArchiveList({
  title,
  description,
  releases,
  emptyMessage,
}: ReleaseArchiveListProps) {
  return (
    <Surface className="landing-panel p-5 sm:p-8 md:p-10 lg:p-11">
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="landing-kicker">{title}</p>
          <h2 className="landing-display landing-text-strong text-[1.85rem] leading-tight text-balance sm:text-3xl md:text-4xl">
            {description}
          </h2>
        </div>

        {releases.length ? (
          <div className="grid gap-4">
            {releases.map((release) => (
              <Card className="landing-proof-tile" key={release.fileName}>
                <CardHeader className="gap-5 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="landing-text-strong text-lg font-semibold leading-tight">
                          v{release.version}
                        </p>
                        {release.isLatest ? (
                          <Chip className="landing-beta-chip" color="accent" variant="soft">
                            Latest
                          </Chip>
                        ) : null}
                      </div>
                      <CardDescription className="landing-text-low text-sm leading-6">
                        Built {formatDateTime(release.builtAt)} from commit {release.shortCommitSha}.
                      </CardDescription>
                    </div>

                    <Link
                      className="landing-button-primary w-full justify-center sm:w-auto"
                      href={release.downloadPath}
                    >
                      Download
                      <Download className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
                      <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">File</p>
                      <p className="landing-text-soft mt-2 text-sm leading-6 break-all">
                        {release.fileName}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
                      <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">Size</p>
                      <p className="landing-text-soft mt-2 text-sm leading-6">
                        {formatFileSize(release.size)}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3">
                      <p className="landing-text-dim text-[0.7rem] uppercase tracking-[0.2em]">Platform</p>
                      <p className="landing-text-soft mt-2 text-sm leading-6 capitalize">
                        {release.platform}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="landing-proof-tile">
            <CardHeader className="gap-3 p-5 sm:p-6">
              <p className="landing-text-strong text-lg font-semibold">Nothing published yet</p>
              <CardDescription className="landing-text-low text-sm leading-6">
                {emptyMessage}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </Surface>
  );
}
