/**
 * Asset manager — downloads, caches, and verifies LPC sprite assets
 * for npm-installed CLI users who don't have the full repo checkout.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  mkdir, readFile, writeFile, rm, stat, readdir,
} from 'node:fs/promises';
import { get as httpsGet } from 'node:https';
import { get as httpGet, type IncomingMessage } from 'node:http';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AssetManifest {
  version: string;
  generatedAt: string;
  chunks: AssetChunk[];
  totalSize: number;
}

export interface AssetChunk {
  name: string;
  filename: string;
  url: string;
  size: number;
  sha256: string;
  required: boolean;
}

interface LocalManifest {
  version: string;
  installedAt: string;
  chunks: string[];
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const GITHUB_REPO = 'LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator';
const MANIFEST_FILENAME = 'assets-manifest.json';
const LOCAL_MANIFEST = '.lpc-forge-manifest.json';

// ──────────────────────────────────────────────
// Asset directory resolution
// ──────────────────────────────────────────────

/** Platform-aware asset cache directory */
export function getAssetDir(): string {
  if (process.env.LPC_FORGE_ASSETS) {
    return resolve(process.env.LPC_FORGE_ASSETS);
  }

  const p = platform();
  if (p === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'lpc-forge', 'assets');
  }
  if (p === 'win32') {
    return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'lpc-forge', 'assets');
  }
  // Linux / other — respect XDG
  return join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'lpc-forge', 'assets');
}

/**
 * Resolve the root directory where `spritesheets/` and `sheet_definitions/` live.
 *
 * Priority:
 *  1. LPC_FORGE_ASSETS env var
 *  2. Local repo checkout (spritesheets/ next to package root)
 *  3. Cached asset directory (~/.lpc-forge/assets or platform equivalent)
 */
export function resolveAssetRoot(packageRoot: string): string {
  if (process.env.LPC_FORGE_ASSETS) {
    return resolve(process.env.LPC_FORGE_ASSETS);
  }

  // Check if running from a git clone / dev checkout
  if (existsSync(join(packageRoot, 'spritesheets'))) {
    return packageRoot;
  }

  return getAssetDir();
}

// ──────────────────────────────────────────────
// Status checks
// ──────────────────────────────────────────────

/** Check if assets are installed and match the expected version */
export async function isAssetsInstalled(version?: string): Promise<{
  installed: boolean;
  version?: string;
  chunks?: string[];
  path: string;
}> {
  const assetDir = getAssetDir();
  const manifestPath = join(assetDir, LOCAL_MANIFEST);

  if (!existsSync(manifestPath)) {
    return { installed: false, path: assetDir };
  }

  try {
    const raw = await readFile(manifestPath, 'utf-8');
    const manifest: LocalManifest = JSON.parse(raw);

    // Check if critical directories actually exist
    const hasSpritesheets = existsSync(join(assetDir, 'spritesheets'));
    const hasDefinitions = existsSync(join(assetDir, 'sheet_definitions'));

    if (!hasSpritesheets || !hasDefinitions) {
      return { installed: false, path: assetDir };
    }

    // Version mismatch check
    if (version && manifest.version !== version) {
      return {
        installed: false,
        version: manifest.version,
        chunks: manifest.chunks,
        path: assetDir,
      };
    }

    return {
      installed: true,
      version: manifest.version,
      chunks: manifest.chunks,
      path: assetDir,
    };
  } catch {
    return { installed: false, path: assetDir };
  }
}

// ──────────────────────────────────────────────
// Download helpers
// ──────────────────────────────────────────────

function followRedirects(url: string, maxRedirects = 5): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const getter = url.startsWith('https') ? httpsGet : httpGet;
    const req = getter(url, {
      headers: { 'User-Agent': 'lpc-forge-cli' },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // drain the response
        followRedirects(res.headers.location, maxRedirects - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

async function downloadToFile(
  url: string,
  destPath: string,
  onProgress?: (downloaded: number, total: number | null) => void,
): Promise<void> {
  const res = await followRedirects(url);
  const total = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;

  await mkdir(join(destPath, '..'), { recursive: true });

  const tmpPath = destPath + '.tmp';
  const ws = createWriteStream(tmpPath);

  let downloaded = 0;
  res.on('data', (chunk: Buffer) => {
    downloaded += chunk.length;
    onProgress?.(downloaded, total);
  });

  try {
    await pipeline(res, ws);
    // Atomic rename from tmp to final
    const { rename } = await import('node:fs/promises');
    await rename(tmpPath, destPath);
  } catch (err) {
    // Clean up partial file
    await rm(tmpPath, { force: true });
    throw err;
  }
}

async function computeSha256(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

// ──────────────────────────────────────────────
// Manifest fetching
// ──────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await followRedirects(url);
  const chunks: Buffer[] = [];
  for await (const chunk of res) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T;
}

/** Fetch the remote asset manifest from the latest GitHub release */
export async function fetchRemoteManifest(version?: string): Promise<AssetManifest> {
  const tag = version || 'latest';
  // For 'latest', use the GitHub API to resolve the actual tag
  if (tag === 'latest') {
    const releaseUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const release = await fetchJson<{ tag_name: string; assets: { name: string; browser_download_url: string }[] }>(releaseUrl);

    const manifestAsset = release.assets.find(a => a.name === MANIFEST_FILENAME);
    if (!manifestAsset) {
      throw new Error(
        `No ${MANIFEST_FILENAME} found in latest release (${release.tag_name}). ` +
        `The release may not have been packaged correctly.`,
      );
    }
    return fetchJson<AssetManifest>(manifestAsset.browser_download_url);
  }

  const url = `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${MANIFEST_FILENAME}`;
  return fetchJson<AssetManifest>(url);
}

// ──────────────────────────────────────────────
// Download + extract
// ──────────────────────────────────────────────

export interface DownloadOptions {
  /** Only download required chunks (body + definitions) */
  minimal?: boolean;
  /** Custom asset directory (overrides default) */
  path?: string;
  /** Callback for progress updates */
  onProgress?: (state: DownloadProgress) => void;
  /** Skip interactive prompts */
  nonInteractive?: boolean;
}

export interface DownloadProgress {
  phase: 'fetching-manifest' | 'downloading' | 'verifying' | 'extracting' | 'done';
  currentChunk?: string;
  chunkIndex?: number;
  totalChunks?: number;
  bytesDownloaded?: number;
  bytesTotal?: number | null;
  overallDownloaded?: number;
  overallTotal?: number;
}

export async function downloadAssets(options: DownloadOptions = {}): Promise<void> {
  const assetDir = options.path ? resolve(options.path) : getAssetDir();

  // Check available disk space (best-effort)
  await checkDiskSpace(assetDir);

  // 1. Fetch manifest
  options.onProgress?.({ phase: 'fetching-manifest' });
  const manifest = await fetchRemoteManifest();

  // 2. Filter chunks
  let chunks = manifest.chunks;
  if (options.minimal) {
    chunks = chunks.filter(c => c.required);
  }

  const totalSize = chunks.reduce((s, c) => s + c.size, 0);
  let overallDownloaded = 0;

  // 3. Download and extract each chunk
  await mkdir(assetDir, { recursive: true });
  const downloadedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const archivePath = join(assetDir, chunk.filename);

    // Download
    options.onProgress?.({
      phase: 'downloading',
      currentChunk: chunk.name,
      chunkIndex: i,
      totalChunks: chunks.length,
      bytesDownloaded: 0,
      bytesTotal: chunk.size,
      overallDownloaded,
      overallTotal: totalSize,
    });

    await downloadToFile(chunk.url, archivePath, (downloaded, total) => {
      options.onProgress?.({
        phase: 'downloading',
        currentChunk: chunk.name,
        chunkIndex: i,
        totalChunks: chunks.length,
        bytesDownloaded: downloaded,
        bytesTotal: total ?? chunk.size,
        overallDownloaded: overallDownloaded + downloaded,
        overallTotal: totalSize,
      });
    });

    overallDownloaded += chunk.size;

    // Verify checksum
    options.onProgress?.({
      phase: 'verifying',
      currentChunk: chunk.name,
      chunkIndex: i,
      totalChunks: chunks.length,
    });

    const actualHash = await computeSha256(archivePath);
    if (actualHash !== chunk.sha256) {
      await rm(archivePath, { force: true });
      throw new Error(
        `Checksum mismatch for ${chunk.filename}. ` +
        `Expected ${chunk.sha256}, got ${actualHash}. ` +
        `The file may be corrupted — try again.`,
      );
    }

    // Extract
    options.onProgress?.({
      phase: 'extracting',
      currentChunk: chunk.name,
      chunkIndex: i,
      totalChunks: chunks.length,
    });

    await execFileAsync('tar', ['xzf', archivePath, '-C', assetDir]);

    // Remove archive after extraction to save space
    await rm(archivePath, { force: true });

    downloadedChunks.push(chunk.name);
  }

  // 4. Write local manifest
  const localManifest: LocalManifest = {
    version: manifest.version,
    installedAt: new Date().toISOString(),
    chunks: downloadedChunks,
  };
  await writeFile(join(assetDir, LOCAL_MANIFEST), JSON.stringify(localManifest, null, 2));

  options.onProgress?.({ phase: 'done' });
}

// ──────────────────────────────────────────────
// Disk space check (best-effort)
// ──────────────────────────────────────────────

async function checkDiskSpace(dir: string): Promise<void> {
  // Ensure parent exists for statvfs
  await mkdir(dir, { recursive: true });

  try {
    // Use df on Unix-like systems
    if (platform() !== 'win32') {
      const { stdout } = await execFileAsync('df', ['-k', dir]);
      const lines = stdout.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const availKB = parseInt(parts[3], 10);
        if (!isNaN(availKB)) {
          const availMB = availKB / 1024;
          if (availMB < 2000) { // Less than 2GB available
            throw new Error(
              `Insufficient disk space: ${Math.round(availMB)} MB available, ` +
              `but assets require ~1.3 GB. Free up space or use --path to specify a different location.`,
            );
          }
        }
      }
    }
  } catch (err) {
    // If it's our own insufficient space error, re-throw
    if (err instanceof Error && err.message.includes('Insufficient disk space')) {
      throw err;
    }
    // Otherwise ignore — best-effort check
  }
}

// ──────────────────────────────────────────────
// Clean up
// ──────────────────────────────────────────────

export async function cleanAssets(assetDir?: string): Promise<void> {
  const dir = assetDir || getAssetDir();
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

// ──────────────────────────────────────────────
// Interactive prompt
// ──────────────────────────────────────────────

/** Ask user yes/no in the terminal. Returns true for yes. */
export async function promptYesNo(question: string): Promise<boolean> {
  // Non-interactive / CI environments
  if (process.env.LPC_FORGE_AUTO_DOWNLOAD === 'true') {
    return true;
  }
  if (!process.stdin.isTTY) {
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<boolean>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === '' || a === 'y' || a === 'yes');
    });
  });
}

// ──────────────────────────────────────────────
// Ensure assets (called before sprite commands)
// ──────────────────────────────────────────────

/**
 * Ensures assets are available. If missing, prompts the user to download them.
 * Returns the resolved asset root path.
 * Throws if assets are unavailable and user declines download.
 */
export async function ensureAssets(packageRoot: string): Promise<string> {
  const assetRoot = resolveAssetRoot(packageRoot);

  // If we found a local checkout with spritesheets, we're good
  if (existsSync(join(assetRoot, 'spritesheets')) && existsSync(join(assetRoot, 'sheet_definitions'))) {
    return assetRoot;
  }

  // Assets not found — need to download
  const chalk = (await import('chalk')).default;

  console.log('');
  console.log(chalk.yellow('⚠️  LPC Forge assets not found.') + ' These are required for sprite generation.');
  console.log('');
  console.log(`   Total download: ${chalk.bold('~1.3 GB')} (305,680 sprite files)`);
  console.log(`   Install location: ${chalk.gray(getAssetDir())}`);
  console.log('');

  const proceed = await promptYesNo(`   Download now? (Y/n): `);

  if (!proceed) {
    console.log('');
    console.log(chalk.gray('   Run ') + chalk.cyan('lpc-forge setup') + chalk.gray(' when ready to download.'));
    console.log(chalk.gray('   Run ') + chalk.cyan('lpc-forge setup --help') + chalk.gray(' for more options.'));
    console.log('');
    process.exit(1);
  }

  // Download with progress display
  await downloadWithProgress();

  return getAssetDir();
}

// ──────────────────────────────────────────────
// Progress display
// ──────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function progressBar(fraction: number, width = 20): string {
  const filled = Math.round(fraction * width);
  const empty = width - filled;
  return '[' + '#'.repeat(filled) + '-'.repeat(empty) + ']';
}

export async function downloadWithProgress(options: DownloadOptions = {}): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  let manifest: AssetManifest;
  const manifestSpinner = ora('Fetching asset manifest...').start();
  try {
    manifest = await fetchRemoteManifest();
    manifestSpinner.succeed('Asset manifest fetched');
  } catch (err) {
    manifestSpinner.fail('Failed to fetch asset manifest');
    throw err;
  }

  let chunks = manifest.chunks;
  if (options.minimal) {
    chunks = chunks.filter(c => c.required);
  }

  const totalSize = chunks.reduce((s, c) => s + c.size, 0);
  const assetDir = options.path ? resolve(options.path) : getAssetDir();

  console.log('');
  console.log(chalk.bold('📦 Downloading LPC Forge assets...'));
  console.log('');

  await mkdir(assetDir, { recursive: true });
  await checkDiskSpace(assetDir);

  const downloadedChunks: string[] = [];
  let overallDownloaded = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const archivePath = join(assetDir, chunk.filename);

    // Show which chunk we're downloading
    const spinner = ora({
      text: `${chunk.name} (${formatBytes(chunk.size)})`,
      prefixText: '  ',
    }).start();

    try {
      // Download
      await downloadToFile(chunk.url, archivePath, (downloaded, total) => {
        const t = total ?? chunk.size;
        const pct = Math.round((downloaded / t) * 100);
        spinner.text = `${chunk.name} (${formatBytes(chunk.size)})  ${progressBar(downloaded / t)}  ${pct}%`;
      });

      // Verify
      spinner.text = `${chunk.name} — verifying checksum...`;
      const actualHash = await computeSha256(archivePath);
      if (actualHash !== chunk.sha256) {
        await rm(archivePath, { force: true });
        spinner.fail(`${chunk.name} — checksum mismatch`);
        throw new Error(
          `Checksum mismatch for ${chunk.filename}. ` +
          `Expected ${chunk.sha256}, got ${actualHash}.`,
        );
      }

      // Extract
      spinner.text = `${chunk.name} — extracting...`;
      await execFileAsync('tar', ['xzf', archivePath, '-C', assetDir]);
      await rm(archivePath, { force: true });

      overallDownloaded += chunk.size;
      spinner.succeed(
        `${chunk.name} (${formatBytes(chunk.size)})`,
      );
      downloadedChunks.push(chunk.name);
    } catch (err) {
      spinner.fail(`${chunk.name} — failed`);
      throw err;
    }
  }

  // Write local manifest
  const localManifest: LocalManifest = {
    version: manifest.version,
    installedAt: new Date().toISOString(),
    chunks: downloadedChunks,
  };
  await writeFile(join(assetDir, LOCAL_MANIFEST), JSON.stringify(localManifest, null, 2));

  console.log('');
  console.log(chalk.green(`✅ Assets installed (${formatBytes(overallDownloaded)}) → ${assetDir}`));
  console.log('');
}
