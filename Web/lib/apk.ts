import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const APK_MIME_TYPE = "application/vnd.android.package-archive";

const APK_FILE_NAME_PATTERN = /^lifemeter-[A-Za-z0-9._-]+\.apk$/;

type LatestApkMetadata = {
  fileName: string;
  version: string;
  commitSha: string;
  builtAt: string;
};

export class ApkLookupError extends Error {
  status: number;

  constructor(message: string, status = 404) {
    super(message);
    this.name = "ApkLookupError";
    this.status = status;
  }
}

function getStorageDir() {
  const value = process.env.APK_STORAGE_DIR?.trim();

  if (!value) {
    throw new ApkLookupError("APK download is not configured.", 503);
  }

  return path.resolve(value);
}

function isLatestApkMetadata(value: unknown): value is LatestApkMetadata {
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

function normalizeApkFileName(fileName: string) {
  if (!APK_FILE_NAME_PATTERN.test(fileName)) {
    throw new ApkLookupError("APK not found.");
  }

  return fileName;
}

function resolveApkPath(storageDir: string, fileName: string) {
  const normalizedFileName = normalizeApkFileName(fileName);
  const resolvedPath = path.resolve(storageDir, normalizedFileName);
  const storageRoot = `${path.resolve(storageDir)}${path.sep}`;

  if (!resolvedPath.startsWith(storageRoot)) {
    throw new ApkLookupError("APK not found.");
  }

  return resolvedPath;
}

async function ensureReadableFile(filePath: string) {
  let fileInfo;

  try {
    fileInfo = await stat(filePath);
  } catch {
    throw new ApkLookupError("APK not found.");
  }

  if (!fileInfo.isFile()) {
    throw new ApkLookupError("APK not found.");
  }

  return fileInfo;
}

export async function getLatestApkMetadata() {
  const storageDir = getStorageDir();
  const metadataPath = path.join(storageDir, "latest.json");

  let rawMetadata: string;

  try {
    rawMetadata = await readFile(metadataPath, "utf8");
  } catch {
    throw new ApkLookupError("Latest APK is not available.");
  }

  let metadata: unknown;

  try {
    metadata = JSON.parse(rawMetadata);
  } catch {
    throw new ApkLookupError("Latest APK metadata is invalid.", 500);
  }

  if (!isLatestApkMetadata(metadata)) {
    throw new ApkLookupError("Latest APK metadata is invalid.", 500);
  }

  await ensureReadableFile(resolveApkPath(storageDir, metadata.fileName));

  return {
    metadata,
    storageDir,
  };
}

export async function readApkFile(fileName: string) {
  const storageDir = getStorageDir();
  const normalizedFileName = normalizeApkFileName(fileName);
  const filePath = resolveApkPath(storageDir, normalizedFileName);
  const fileInfo = await ensureReadableFile(filePath);
  const buffer = await readFile(filePath);

  return {
    buffer,
    fileName: normalizedFileName,
    size: fileInfo.size,
  };
}
