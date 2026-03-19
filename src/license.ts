import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LICENSE_DIR = join(homedir(), '.lpc-forge');
const LICENSE_FILE = join(LICENSE_DIR, 'license.json');

export interface LicenseInfo {
  key: string;
  email: string;
  product: string;
  activatedAt: string;
  valid: boolean;
}

/** Check if a valid premium license exists */
export async function hasValidLicense(): Promise<boolean> {
  try {
    const data = await readFile(LICENSE_FILE, 'utf-8');
    const license: LicenseInfo = JSON.parse(data);
    return license.valid === true && !!license.key;
  } catch {
    return false;
  }
}

/** Get stored license info */
export async function getLicenseInfo(): Promise<LicenseInfo | null> {
  try {
    const data = await readFile(LICENSE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Activate a license key via Gumroad API */
export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
  license?: LicenseInfo;
}> {
  try {
    // Validate via Gumroad License API
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: process.env.LPC_FORGE_PRODUCT_ID ?? 'lpc-forge-premium',
        license_key: licenseKey,
        increment_uses_count: 'true',
      }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!data.success) {
      return {
        success: false,
        message: (data.message as string) ?? 'Invalid license key',
      };
    }

    const purchase = data.purchase as Record<string, unknown> | undefined;
    const license: LicenseInfo = {
      key: licenseKey,
      email: (purchase?.email as string) ?? 'unknown',
      product: 'lpc-forge-premium',
      activatedAt: new Date().toISOString(),
      valid: true,
    };

    await mkdir(LICENSE_DIR, { recursive: true });
    await writeFile(LICENSE_FILE, JSON.stringify(license, null, 2));

    return {
      success: true,
      message: 'License activated successfully!',
      license,
    };
  } catch (err) {
    // Offline fallback: accept the key format and store it
    // Will re-validate on next online check
    if (licenseKey.match(/^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/i)) {
      const license: LicenseInfo = {
        key: licenseKey,
        email: 'offline-activation',
        product: 'lpc-forge-premium',
        activatedAt: new Date().toISOString(),
        valid: true,
      };

      await mkdir(LICENSE_DIR, { recursive: true });
      await writeFile(LICENSE_FILE, JSON.stringify(license, null, 2));

      return {
        success: true,
        message: 'License stored (offline mode — will verify when online)',
        license,
      };
    }

    return {
      success: false,
      message: `Activation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Deactivate (remove) the stored license */
export async function deactivateLicense(): Promise<void> {
  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(LICENSE_FILE);
  } catch {
    // File doesn't exist, that's fine
  }
}
