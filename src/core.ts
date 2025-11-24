import fs from "fs/promises";
import path from "path";
import { minimatch } from "minimatch";
import pLimit from "p-limit";

export interface FolderSizeResult {
  path: string;
  size: number;
  formattedSize: string;
  error?: string;
}

export interface FolderSizeOptions {
  ignore?: string[];
  concurrencyLimit?: number;
  signal?: AbortSignal;
  cache?: Map<string, number>; // optional external cache
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

async function getFolderSize(
  dirPath: string,
  ignore: string[] = [],
  limit: (fn: () => Promise<any>) => Promise<any>,
  options: FolderSizeOptions
): Promise<number> {
  if (options.signal?.aborted) return 0;
  const cached = options.cache?.get(dirPath);
  if (cached !== undefined) return cached;

  const normalized = dirPath.split(path.sep).join("/");
  if (
    ignore.length > 0 &&
    ignore.some((pattern) => minimatch(normalized, pattern, { dot: true }))
  ) {
    options.cache?.set(dirPath, 0);
    return 0;
  }

  try {
    // Limit the FS operation
    const stats = await limit(() => fs.lstat(dirPath));

    if (stats.isSymbolicLink()) {
      options.cache?.set(dirPath, 0);
      return 0;
    }
    if (stats.isFile()) {
      options.cache?.set(dirPath, stats.size);
      return stats.size;
    }
    if (stats.isDirectory()) {
      // Limit the FS operation
      const files = await limit(() => fs.readdir(dirPath));

      const sizes = await Promise.all(
        files.map((file) =>
          // Do NOT limit the recursive call itself, as it waits for children
          getFolderSize(path.join(dirPath, file), ignore, limit, options)
        )
      );
      const total = sizes.reduce((acc, curr) => acc + curr, 0);
      options.cache?.set(dirPath, total);
      return total;
    }
  } catch {
    options.cache?.set(dirPath, 0);
    return 0;
  }
  return 0;
}

export async function analyzeFolders(
  folders: string[],
  options: FolderSizeOptions = {}
): Promise<FolderSizeResult[]> {
  const results: FolderSizeResult[] = [];
  const limit = pLimit(options.concurrencyLimit || 8);
  const cache = options.cache || new Map<string, number>();
  options.cache = cache;

  for (const folder of folders) {
    if (options.signal?.aborted) break;
    try {
      await fs.access(folder);
      const size = await getFolderSize(
        folder,
        options.ignore || [],
        limit,
        options
      );
      results.push({ path: folder, size, formattedSize: formatBytes(size) });
    } catch (error: any) {
      results.push({
        path: folder,
        size: 0,
        formattedSize: "0 Bytes",
        error: error.code === "ENOENT" ? "Folder not found" : error.message,
      });
    }
  }
  return results;
}

export function createAbortController() {
  return new AbortController();
}
