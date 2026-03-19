import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, unlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LICENSE_DIR = join(homedir(), '.lpc-forge');
const LICENSE_FILE = join(LICENSE_DIR, 'license.json');

describe('License Security', () => {
  // Save and restore any existing license file
  let existingLicense: string | null = null;

  beforeEach(async () => {
    try {
      existingLicense = await readFile(LICENSE_FILE, 'utf-8');
    } catch {
      existingLicense = null;
    }
    // Clean slate
    try {
      await unlink(LICENSE_FILE);
    } catch {
      // OK
    }
  });

  afterEach(async () => {
    // Restore original license if it existed
    try {
      await unlink(LICENSE_FILE);
    } catch {
      // OK
    }
    if (existingLicense) {
      await mkdir(LICENSE_DIR, { recursive: true });
      await writeFile(LICENSE_FILE, existingLicense);
    }
  });

  it('should reject when no license file exists', async () => {
    const { hasValidLicense } = await import('../license.js');
    expect(await hasValidLicense()).toBe(false);
  });

  it('should reject a manually crafted license file (no valid signature)', async () => {
    const fakeLicense = {
      key: 'AAAAAAAA-BBBBBBBB-CCCCCCCC-DDDDDDDD',
      email: 'hacker@example.com',
      product: 'lpc-forge-premium',
      activatedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      machineId: 'fakemachine12345',
      signature: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      _v: 2,
    };
    await mkdir(LICENSE_DIR, { recursive: true });
    await writeFile(LICENSE_FILE, JSON.stringify(fakeLicense, null, 2));

    // Re-import to get fresh module
    const mod = await import('../license.js');
    expect(await mod.hasValidLicense()).toBe(false);
  });

  it('should reject a license with valid: true but no signature', async () => {
    const fakeLicense = {
      key: 'AAAAAAAA-BBBBBBBB-CCCCCCCC-DDDDDDDD',
      email: 'hacker@example.com',
      product: 'lpc-forge-premium',
      activatedAt: new Date().toISOString(),
      valid: true, // Old format field — should be ignored
    };
    await mkdir(LICENSE_DIR, { recursive: true });
    await writeFile(LICENSE_FILE, JSON.stringify(fakeLicense, null, 2));

    const mod = await import('../license.js');
    expect(await mod.hasValidLicense()).toBe(false);
  });

  it('should reject a license file with just { valid: true }', async () => {
    await mkdir(LICENSE_DIR, { recursive: true });
    await writeFile(LICENSE_FILE, '{"valid": true}');

    const mod = await import('../license.js');
    expect(await mod.hasValidLicense()).toBe(false);
  });

  it('should reject a license with future activation date', async () => {
    const futureDate = new Date(Date.now() + 365 * 86400000).toISOString();
    const fakeLicense = {
      key: 'AAAAAAAA-BBBBBBBB-CCCCCCCC-DDDDDDDD',
      email: 'timehacker@example.com',
      product: 'lpc-forge-premium',
      activatedAt: futureDate,
      lastVerifiedAt: futureDate,
      machineId: 'whatever',
      signature: 'whatever',
      _v: 2,
    };
    await mkdir(LICENSE_DIR, { recursive: true });
    await writeFile(LICENSE_FILE, JSON.stringify(fakeLicense, null, 2));

    const mod = await import('../license.js');
    expect(await mod.hasValidLicense()).toBe(false);
  });

  it('should reject invalid key format', async () => {
    const { activateLicense } = await import('../license.js');
    const result = await activateLicense('not-a-valid-key');
    expect(result.success).toBe(false);
    expect(result.message).toContain('format');
  });

  it('getLicenseInfo should mask the key', async () => {
    const { getLicenseInfo } = await import('../license.js');
    const info = await getLicenseInfo();
    // No license = null
    if (info) {
      expect(info.key).toContain('****');
      // Should not expose the full key
      expect(info.key.length).toBeLessThan(40);
    }
  });

  it('deactivateLicense should work even when no license exists', async () => {
    const { deactivateLicense } = await import('../license.js');
    // Should not throw
    await expect(deactivateLicense()).resolves.toBeUndefined();
  });
});
