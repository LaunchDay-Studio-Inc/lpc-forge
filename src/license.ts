import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir, hostname, platform, arch } from 'node:os';
import { createHmac } from 'node:crypto';

const LICENSE_DIR = join(homedir(), '.lpc-forge');
const LICENSE_FILE = join(LICENSE_DIR, 'license.json');

/**
 * HMAC signing key derived from a combination of factors.
 * This isn't meant to be uncrackable — it's a Node CLI tool, the source is
 * open. The goal is to make casual bypass inconvenient enough that buying
 * $10 is easier. Determined crackers will always win; we optimize for the
 * honest middle.
 */
const SIGNING_SEED = 'lpc-forge:blueth:2026';

export interface LicenseInfo {
  /** The license key from Gumroad */
  key: string;
  /** Email from purchase */
  email: string;
  /** Product identifier */
  product: string;
  /** ISO timestamp of activation */
  activatedAt: string;
  /** ISO timestamp of last successful verification */
  lastVerifiedAt: string;
  /** Machine fingerprint at activation time */
  machineId: string;
  /** HMAC signature of the license data */
  signature: string;
}

interface StoredLicense extends LicenseInfo {
  /** Internal version for migration */
  _v: number;
}

// ─── Machine Fingerprint ──────────────────────────────────────────────

function getMachineFingerprint(): string {
  const raw = `${hostname()}:${platform()}:${arch()}:${homedir()}`;
  return createHmac('sha256', SIGNING_SEED).update(raw).digest('hex').slice(0, 16);
}

// ─── HMAC Signing ─────────────────────────────────────────────────────

function signLicense(data: Omit<LicenseInfo, 'signature'>): string {
  const payload = [
    data.key,
    data.email,
    data.product,
    data.activatedAt,
    data.lastVerifiedAt,
    data.machineId,
  ].join('|');
  return createHmac('sha256', SIGNING_SEED).update(payload).digest('hex');
}

function verifySignature(license: LicenseInfo): boolean {
  const { signature, ...data } = license;
  return signLicense(data) === signature;
}

// ─── License Validation ───────────────────────────────────────────────

/**
 * Check if a valid premium license exists.
 *
 * Validates:
 * 1. File exists and parses
 * 2. HMAC signature is correct (not tampered)
 * 3. Machine fingerprint matches (not copied from another machine)
 * 4. Key format is valid
 * 5. Activation is not absurdly far in the future
 *
 * Periodic re-validation:
 * - If last online verification was > 30 days ago, attempts re-verify
 * - If re-verify fails due to network, still valid (grace period)
 * - If re-verify fails due to invalid key, invalidates
 */
export async function hasValidLicense(): Promise<boolean> {
  try {
    const license = await loadLicense();
    if (!license) return false;

    // Signature check (tamper detection)
    if (!verifySignature(license)) {
      return false;
    }

    // Machine binding check
    if (license.machineId !== getMachineFingerprint()) {
      return false;
    }

    // Key format sanity
    if (!isValidKeyFormat(license.key)) {
      return false;
    }

    // Activation date sanity (not in the future)
    const activated = new Date(license.activatedAt);
    if (activated.getTime() > Date.now() + 86400000) {
      return false;
    }

    // Periodic re-validation (every 30 days)
    const lastVerified = new Date(license.lastVerifiedAt);
    const daysSinceVerify = (Date.now() - lastVerified.getTime()) / 86400000;

    if (daysSinceVerify > 30) {
      // Try to re-verify online, but don't block on failure
      const revalidated = await revalidateOnline(license);
      if (revalidated === 'invalid') {
        // Key was explicitly rejected by Gumroad (refunded, disabled, etc.)
        await removeLicense();
        return false;
      }
      // 'valid' or 'network_error' — both count as OK (grace period)
      if (revalidated === 'valid') {
        await updateLastVerified(license);
      }
    }

    return true;
  } catch {
    return false;
  }
}

/** Require a valid license or exit with purchase instructions */
export async function requireLicense(commandName: string): Promise<void> {
  const valid = await hasValidLicense();
  if (!valid) {
    const chalk = (await import('chalk')).default;
    console.log('');
    console.log(chalk.yellow(`⚠ The "${commandName}" command requires LPC Forge Premium.`));
    console.log('');
    console.log(chalk.white('  Purchase at:  ') + chalk.cyan.underline('https://blueth.online/plugins/lpc-forge'));
    console.log(chalk.white('  Then activate:    ') + chalk.green('lpc-forge activate <your-license-key>'));
    console.log('');
    console.log(chalk.gray('  Free commands: character, batch, list, map, init (without --full)'));
    console.log('');
    process.exit(1);
  }
}

// ─── Key Format ───────────────────────────────────────────────────────

function isValidKeyFormat(key: string): boolean {
  // Gumroad format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX (hex)
  return /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/i.test(key);
}

// ─── Online Verification ──────────────────────────────────────────────

async function revalidateOnline(
  license: LicenseInfo,
): Promise<'valid' | 'invalid' | 'network_error'> {
  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: process.env.LPC_FORGE_PRODUCT_ID ?? '-2jxD5LR4p_tXnvxMiWU7g==',
        license_key: license.key,
        increment_uses_count: 'false', // Don't increment on re-validation
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (data.success) return 'valid';

    // Check if explicitly rejected (refunded/disabled) vs just error
    const msg = String(data.message ?? '').toLowerCase();
    if (msg.includes('not found') || msg.includes('disabled') || msg.includes('refund')) {
      return 'invalid';
    }

    return 'network_error';
  } catch {
    return 'network_error';
  }
}

// ─── File Operations ──────────────────────────────────────────────────

async function loadLicense(): Promise<LicenseInfo | null> {
  try {
    const raw = await readFile(LICENSE_FILE, 'utf-8');
    const data = JSON.parse(raw) as StoredLicense;
    if (!data.key || !data.signature || !data.machineId) return null;
    return data;
  } catch {
    return null;
  }
}

async function storeLicense(license: LicenseInfo): Promise<void> {
  const stored: StoredLicense = { ...license, _v: 2 };
  await mkdir(LICENSE_DIR, { recursive: true });
  await writeFile(LICENSE_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
}

async function updateLastVerified(license: LicenseInfo): Promise<void> {
  const updated: LicenseInfo = {
    ...license,
    lastVerifiedAt: new Date().toISOString(),
    signature: '', // Will be re-signed
  };
  updated.signature = signLicense(updated);
  await storeLicense(updated);
}

async function removeLicense(): Promise<void> {
  try {
    await unlink(LICENSE_FILE);
  } catch {
    // Doesn't exist, that's fine
  }
}

// ─── Public API ───────────────────────────────────────────────────────

/** Get stored license info (for display only) */
export async function getLicenseInfo(): Promise<{
  key: string;
  email: string;
  activatedAt: string;
  lastVerifiedAt: string;
  valid: boolean;
} | null> {
  const license = await loadLicense();
  if (!license) return null;

  const valid = verifySignature(license) && license.machineId === getMachineFingerprint();

  return {
    key: license.key.slice(0, 8) + '-****-****-' + license.key.slice(-8),
    email: license.email,
    activatedAt: license.activatedAt,
    lastVerifiedAt: license.lastVerifiedAt,
    valid,
  };
}

/** Activate a license key */
export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Format check
  if (!isValidKeyFormat(licenseKey)) {
    return {
      success: false,
      message: 'Invalid key format. Expected: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX',
    };
  }

  // Try online verification first
  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: process.env.LPC_FORGE_PRODUCT_ID ?? '-2jxD5LR4p_tXnvxMiWU7g==',
        license_key: licenseKey,
        increment_uses_count: 'true',
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!data.success) {
      return {
        success: false,
        message: (data.message as string) ?? 'License key rejected by server.',
      };
    }

    const purchase = data.purchase as Record<string, unknown> | undefined;
    const now = new Date().toISOString();
    const machineId = getMachineFingerprint();

    const licenseData: Omit<LicenseInfo, 'signature'> = {
      key: licenseKey,
      email: (purchase?.email as string) ?? 'unknown',
      product: 'lpc-forge-premium',
      activatedAt: now,
      lastVerifiedAt: now,
      machineId,
    };

    const license: LicenseInfo = {
      ...licenseData,
      signature: signLicense(licenseData),
    };

    await storeLicense(license);

    return {
      success: true,
      message: 'License activated successfully!',
    };
  } catch (err) {
    // Offline activation — allow but mark as unverified
    const now = new Date().toISOString();
    const machineId = getMachineFingerprint();
    // Set lastVerifiedAt to epoch so it triggers online check on first use
    const licenseData: Omit<LicenseInfo, 'signature'> = {
      key: licenseKey,
      email: 'offline-activation',
      product: 'lpc-forge-premium',
      activatedAt: now,
      lastVerifiedAt: new Date(0).toISOString(),
      machineId,
    };

    const license: LicenseInfo = {
      ...licenseData,
      signature: signLicense(licenseData),
    };

    await storeLicense(license);

    return {
      success: true,
      message: 'License stored (offline — will verify online on next use).',
    };
  }
}

/** Deactivate the stored license */
export async function deactivateLicense(): Promise<void> {
  await removeLicense();
}
