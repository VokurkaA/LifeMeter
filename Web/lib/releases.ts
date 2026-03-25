import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export type ReleasePlatform = "android" | "ios";

type LatestReleaseMetadata = {
  fileName: string;
  version: string;
  commitSha: string;
  builtAt: string;
};

type ReleasePlatformConfig = {
  label: string;
  envVar: string;
  filePattern: RegExp;
  mimeType: string;
};

export type ReleaseRecord = {
  platform: ReleasePlatform;
  fileName: string;
  version: string;
  commitSha: string;
  shortCommitSha: string;
  builtAt: string;
  size: number;
  isLatest: boolean;
  downloadPath: string;
};

export type PlatformReleaseState = {
  platform: ReleasePlatform;
  label: string;
  latestDownloadPath: string;
  status: "available" | "empty" | "unconfigured";
  message: string;
  latest: ReleaseRecord | null;
  releases: ReleaseRecord[];
};

export class ReleaseLookupError extends Error {
  status: number;

  constructor(message: string, status = 404) {
    super(message);
    this.name = "ReleaseLookupError";
    this.status = status;
  }
}

const PLATFORM_CONFIG: Record<ReleasePlatform, ReleasePlatformConfig> = {
  android: {
    label: "Android",
    envVar: "APK_STORAGE_DIR",
    filePattern: /^lifemeter-([A-Za-z0-9._-]+)-([0-9a-fA-F]{7,40})\.apk$/,
    mimeType: "application/vnd.android.package-archive",
  },
  ios: {
    label: "iOS",
    envVar: "IOS_STORAGE_DIR",
    filePattern: /^lifemeter-([A-Za-z0-9._-]+)-([0-9a-fA-F]{7,40})\.ipa$/,
    mimeType: "application/octet-stream",
  },
};

function getPlatformConfig(platform: ReleasePlatform) {
  return PLATFORM_CONFIG[platform];
}

function toDownloadPath(platform: ReleasePlatform, fileName: string) {
  return `/downloads/${platform}/${encodeURIComponent(fileName)}`;
}

function parseReleaseFileName(platform: ReleasePlatform, fileName: string) {
  const match = getPlatformConfig(platform).filePattern.exec(fileName);

  if (!match?.[1] || !match?.[2]) {
    return null;
  }

  return {
    version: match[1],
    shortCommitSha: match[2].toLowerCase(),
  };
}

function getConfiguredStorageDir(platform: ReleasePlatform) {
  const value = process.env[getPlatformConfig(platform).envVar]?.trim();
  return value ? path.resolve(value) : null;
}

function ensureValidPlatform(value: string): ReleasePlatform {
  if (value === "android" || value === "ios") {
    return value;
  }

  throw new ReleaseLookupError("Release platform not found.");
}

function resolveReleasePath(storageDir: string, platform: ReleasePlatform, fileName: string) {
  const parsedFile = parseReleaseFileName(platform, fileName);

  if (!parsedFile) {
    throw new ReleaseLookupError(`${getPlatformConfig(platform).label} release not found.`);
  }

  const resolvedPath = path.resolve(storageDir, fileName);
  const storageRoot = `${path.resolve(storageDir)}${path.sep}`;

  if (!resolvedPath.startsWith(storageRoot)) {
    throw new ReleaseLookupError(`${getPlatformConfig(platform).label} release not found.`);
  }

  return {
    fileName,
    filePath: resolvedPath,
    parsedFile,
  };
}

async function ensureReadableFile(filePath: string, platform: ReleasePlatform) {
  let fileInfo;

  try {
    fileInfo = await stat(filePath);
  } catch {
    throw new ReleaseLookupError(`${getPlatformConfig(platform).label} release not found.`);
  }

  if (!fileInfo.isFile()) {
    throw new ReleaseLookupError(`${getPlatformConfig(platform).label} release not found.`);
  }

  return fileInfo;
}

function isLatestReleaseMetadata(value: unknown): value is LatestReleaseMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.fileName === "string" &&
    typeof candidate.version === "string" &&
    typeof candidate.commitSha === "string" &&
    typeof candidate.builtAt === "string"
  );
}

async function readLatestMetadata(storageDir: string) {
  const metadataPath = path.join(storageDir, "latest.json");

  try {
    const rawMetadata = await readFile(metadataPath, "utf8");
    const metadata = JSON.parse(rawMetadata) as unknown;

    if (!isLatestReleaseMetadata(metadata)) {
      return null;
    }

    return metadata;
  } catch {
    return null;
  }
}

async function scanReleaseDirectory(platform: ReleasePlatform, storageDir: string) {
  let directoryEntries;

  try {
    directoryEntries = await readdir(storageDir, { withFileTypes: true });
  } catch {
    return [] as ReleaseRecord[];
  }

  const releaseFiles = directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .map((fileName) => {
      const parsedFile = parseReleaseFileName(platform, fileName);
      return parsedFile ? { fileName, parsedFile } : null;
    })
    .filter((entry): entry is { fileName: string; parsedFile: { version: string; shortCommitSha: string } } => Boolean(entry));

  const releases = await Promise.all(
    releaseFiles.map(async ({ fileName, parsedFile }) => {
      const filePath = path.join(storageDir, fileName);
      const fileInfo = await stat(filePath);

      return {
        platform,
        fileName,
        version: parsedFile.version,
        commitSha: parsedFile.shortCommitSha,
        shortCommitSha: parsedFile.shortCommitSha,
        builtAt: fileInfo.mtime.toISOString(),
        size: fileInfo.size,
        isLatest: false,
        downloadPath: toDownloadPath(platform, fileName),
      } satisfies ReleaseRecord;
    }),
  );

  return releases;
}

function compareReleaseDates(left: ReleaseRecord, right: ReleaseRecord) {
  const leftDate = Date.parse(left.builtAt);
  const rightDate = Date.parse(right.builtAt);
  const leftTime = Number.isNaN(leftDate) ? 0 : leftDate;
  const rightTime = Number.isNaN(rightDate) ? 0 : rightDate;

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return right.fileName.localeCompare(left.fileName);
}

function mergeLatestMetadata(releases: ReleaseRecord[], latestMetadata: LatestReleaseMetadata | null) {
  const normalizedLatestFileName = latestMetadata?.fileName ?? null;
  const mergedReleases = releases.map((release) => {
    if (release.fileName !== normalizedLatestFileName || !latestMetadata) {
      return release;
    }

    return {
      ...release,
      version: latestMetadata.version,
      commitSha: latestMetadata.commitSha,
      shortCommitSha: latestMetadata.commitSha.slice(0, 7) || release.shortCommitSha,
      builtAt: latestMetadata.builtAt,
      isLatest: true,
    };
  });

  if (!latestMetadata) {
    return mergedReleases
      .sort(compareReleaseDates)
      .map((release, index) => ({ ...release, isLatest: index === 0 }));
  }

  const hasLatestMatch = mergedReleases.some((release) => release.isLatest);
  const releasesWithLatestFlag = hasLatestMatch
    ? mergedReleases
    : mergedReleases.sort(compareReleaseDates).map((release, index) => ({
        ...release,
        isLatest: index === 0,
      }));

  return releasesWithLatestFlag.sort((left, right) => {
    if (left.isLatest !== right.isLatest) {
      return left.isLatest ? -1 : 1;
    }

    return compareReleaseDates(left, right);
  });
}

function getUnavailableMessage(platform: ReleasePlatform, status: PlatformReleaseState["status"]) {
  if (status === "unconfigured") {
    return `${getPlatformConfig(platform).label} downloads are not configured yet.`;
  }

  return `No ${getPlatformConfig(platform).label.toLowerCase()} releases have been published yet.`;
}

export function isReleasePlatform(value: string): value is ReleasePlatform {
  return value === "android" || value === "ios";
}

export async function getPlatformReleaseState(platform: ReleasePlatform): Promise<PlatformReleaseState> {
  const storageDir = getConfiguredStorageDir(platform);

  if (!storageDir) {
    return {
      platform,
      label: getPlatformConfig(platform).label,
      latestDownloadPath: `/downloads/${platform}/latest`,
      status: "unconfigured",
      message: getUnavailableMessage(platform, "unconfigured"),
      latest: null,
      releases: [],
    };
  }

  const [latestMetadata, releases] = await Promise.all([
    readLatestMetadata(storageDir),
    scanReleaseDirectory(platform, storageDir),
  ]);
  const mergedReleases = mergeLatestMetadata(releases, latestMetadata);
  const latestRelease = mergedReleases.find((release) => release.isLatest) ?? null;
  const status = latestRelease ? "available" : "empty";

  return {
    platform,
    label: getPlatformConfig(platform).label,
    latestDownloadPath: `/downloads/${platform}/latest`,
    status,
    message: getUnavailableMessage(platform, status),
    latest: latestRelease,
    releases: mergedReleases,
  };
}

export async function getLatestRelease(platform: ReleasePlatform) {
  const releaseState = await getPlatformReleaseState(platform);

  if (!releaseState.latest) {
    const statusCode = releaseState.status === "unconfigured" ? 503 : 404;
    throw new ReleaseLookupError(
      releaseState.status === "unconfigured"
        ? `${releaseState.label} downloads are not configured.`
        : `Latest ${releaseState.label} release is not available.`,
      statusCode,
    );
  }

  return releaseState.latest;
}

export async function readReleaseFile(platform: ReleasePlatform, fileName: string) {
  const storageDir = getConfiguredStorageDir(platform);

  if (!storageDir) {
    throw new ReleaseLookupError(`${getPlatformConfig(platform).label} downloads are not configured.`, 503);
  }

  const { filePath, parsedFile } = resolveReleasePath(storageDir, platform, fileName);
  const fileInfo = await ensureReadableFile(filePath, platform);
  const buffer = await readFile(filePath);

  return {
    buffer,
    fileName,
    size: fileInfo.size,
    mimeType: getPlatformConfig(platform).mimeType,
    version: parsedFile.version,
    shortCommitSha: parsedFile.shortCommitSha,
  };
}

export function parseRoutePlatform(platform: string) {
  return ensureValidPlatform(platform);
}
