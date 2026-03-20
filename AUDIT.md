# LPC Forge — Forensic Code Audit

**Repository:** LaunchDay-Studio-Inc/lpc-forge
**Version:** 1.0.5
**Commit:** ac83698d01e75133d1feaaec7beec6042e595f8a
**Auditor:** Claude Code (Opus 4.6)
**Date:** 2026-03-20
**Files Inspected:** 70+ source files, 14 test files, 5 CI workflows, 6 scripts, all configs

---

## Summary

| Category | CRITICAL | HIGH | MEDIUM | LOW | INFO | Total |
|---|---|---|---|---|---|---|
| 1. Security | 4 | 6 | 7 | 4 | 2 | 23 |
| 2. Bugs & Logic Errors | 0 | 8 | 14 | 8 | 2 | 32 |
| 3. Code Quality & Optimization | 0 | 2 | 10 | 14 | 6 | 32 |
| 4. CI/CD & Build Issues | 0 | 2 | 4 | 4 | 3 | 13 |
| 5. Asset Pipeline | 0 | 3 | 5 | 5 | 2 | 15 |
| 6. Character Composition Engine | 0 | 2 | 6 | 5 | 2 | 15 |
| 7. Map Generation | 0 | 3 | 10 | 9 | 3 | 25 |
| 8. Godot Export & Systems | 0 | 5 | 14 | 18 | 8 | 45 |
| **Total** | **4** | **31** | **70** | **67** | **28** | **200** |

---

## 1. Security

### CRITICAL-001 — Hardcoded HMAC signing seed in source
**File:** `src/license.ts:16`
**Severity:** CRITICAL
**Description:** The HMAC signing key `SIGNING_SEED = 'lpc-forge:blueth:2026'` is hardcoded in open source. Any attacker can read this value and forge license signatures.
**Impact:** Complete bypass of the license verification system. Anyone can craft a valid `LicenseInfo` object with a correct HMAC signature.
**Evidence:**
```ts
const SIGNING_SEED = 'lpc-forge:blueth:2026';
```
**Suggested fix:** Move the signing seed to a server-side verification endpoint; do not perform signature validation client-side with a known key.

---

### CRITICAL-002 — Offline activation stores license without server verification
**File:** `src/license.ts:310-334`
**Severity:** CRITICAL
**Description:** When the Gumroad API is unreachable during activation, the license is stored locally without any verification. Combined with CRITICAL-001, an attacker can activate any well-formatted key while offline.
**Impact:** Complete license bypass — disconnect from network, use any 32-hex-char key.
**Evidence:**
```ts
} catch (err) {
    // Offline activation — allow but mark as unverified
    const now = new Date().toISOString();
    const machineId = getMachineFingerprint();
    // Set lastVerifiedAt to epoch so it triggers online check on first use
    const licenseData: Omit<LicenseInfo, 'signature'> = {
      key: licenseKey,
      email: 'offline-activation',
      ...
    };
```
**Suggested fix:** Reject activation when offline, or require server verification before granting any premium features.

---

### CRITICAL-003 — Weak machine fingerprint trivially spoofable
**File:** `src/license.ts:42-45`
**Severity:** CRITICAL
**Description:** The machine fingerprint uses only `hostname`, `platform`, `arch`, and `homedir` — all trivially discoverable and spoofable values.
**Impact:** License file can be copied between machines by setting the same hostname and homedir.
**Evidence:**
```ts
function getMachineFingerprint(): string {
  const raw = `${hostname()}:${platform()}:${arch()}:${homedir()}`;
  return createHmac('sha256', SIGNING_SEED).update(raw).digest('hex').slice(0, 16);
}
```
**Suggested fix:** Use a hardware-bound identifier (e.g., MAC address, disk serial, or OS machine-id).

---

### CRITICAL-004 — Product ID overridable via environment variable
**File:** `src/license.ts:167`
**Severity:** CRITICAL
**Description:** `LPC_FORGE_PRODUCT_ID` env var allows overriding the Gumroad product ID used for license verification. An attacker can set this to their own Gumroad product and validate against that.
**Impact:** Bypass license check by pointing verification at a product the attacker controls.
**Evidence:**
```ts
product_id: process.env.LPC_FORGE_PRODUCT_ID ?? '-2jxD5LR4p_tXnvxMiWU7g==',
```
**Suggested fix:** Remove the environment variable override; hardcode the product ID (or fetch it from a server).

---

### HIGH-001 — Command injection via unsanitized `execAsync` in build script
**File:** `scripts/update_sheet_definitions.js:13`
**Severity:** HIGH
**Description:** Template literal interpolation in `execAsync(\`git show ${branch}:${filePath}\`)` passes unsanitized `filePath` to a shell command. A filename containing shell metacharacters (e.g., `; rm -rf /`) could execute arbitrary commands.
**Impact:** Arbitrary command execution during build/maintenance scripts.
**Evidence:**
```js
const { stdout } = await execAsync(`git show ${branch}:${filePath}`);
```
**Suggested fix:** Use `execFileAsync('git', ['show', `${branch}:${filePath}`])` which does not invoke a shell.

---

### HIGH-002 — SSRF via `followRedirects` with no origin validation
**File:** `src/assets/manager.ts:154-179`
**Severity:** HIGH
**Description:** `followRedirects` follows up to 5 HTTP redirects to any URL including private IPs and internal hosts. A compromised GitHub release could redirect to `http://169.254.169.254/` (cloud metadata endpoint) or internal services.
**Impact:** Server-Side Request Forgery — exfiltrate cloud credentials or probe internal networks.
**Evidence:**
```ts
function followRedirects(url: string, maxRedirects = 5): Promise<IncomingMessage> {
  // ...
  const getter = url.startsWith('https') ? httpsGet : httpGet;
  // No validation of redirect target
  followRedirects(res.headers.location, maxRedirects - 1).then(resolve, reject);
```
**Suggested fix:** Validate redirect targets against an allowlist (e.g., only `github.com`, `objects.githubusercontent.com`); reject private IP ranges.

---

### HIGH-003 — HTTPS downgrade allowed in redirect chain
**File:** `src/assets/manager.ts:161`
**Severity:** HIGH
**Description:** `followRedirects` selects HTTP or HTTPS based on the *redirect* URL. A redirect from HTTPS to HTTP is silently followed, allowing MitM attacks on the download.
**Impact:** Man-in-the-middle could inject malicious asset archives via an HTTPS-to-HTTP downgrade.
**Evidence:**
```ts
const getter = url.startsWith('https') ? httpsGet : httpGet;
```
**Suggested fix:** Reject redirects that downgrade from HTTPS to HTTP.

---

### HIGH-004 — No symlink protection during tar extraction
**File:** `src/assets/manager.ts:454`
**Severity:** HIGH
**Description:** `tar xzf` extracts archives without `--no-same-owner` or symlink filtering. A malicious archive could contain symlinks pointing outside the asset directory (zip-slip / tar-slip attack).
**Impact:** Arbitrary file overwrite on the user's system via crafted asset archives.
**Evidence:**
```ts
await execFileAsync('tar', ['xzf', archivePath, '-C', assetDir]);
```
**Suggested fix:** Add `--no-same-owner` flag and use `tar --strip-components` or validate extracted paths post-extraction.

---

### HIGH-005 — Path traversal via `LPC_FORGE_ASSETS` env var
**File:** `src/assets/manager.ts:63-64`
**Severity:** HIGH
**Description:** The `LPC_FORGE_ASSETS` environment variable is passed to `resolve()` without validation. A malicious value like `/etc` or `/tmp/../../etc` would be accepted, and subsequent tar extraction would write files there.
**Impact:** Asset extraction to arbitrary filesystem locations.
**Evidence:**
```ts
if (process.env.LPC_FORGE_ASSETS) {
    return resolve(process.env.LPC_FORGE_ASSETS);
}
```
**Suggested fix:** Validate that the resolved path is within an expected parent directory or user home.

---

### HIGH-006 — Path traversal in system file writer
**File:** `src/systems/writer.ts:28-30`
**Severity:** HIGH
**Description:** `file.path` from system generators is joined with `outputDir` using `join()`, but never validated. A generator returning `../../etc/cron.d/backdoor` would write outside the output directory.
**Impact:** Arbitrary file write if system generators are modified or fed untrusted input.
**Evidence:**
```ts
const fullPath = join(outputDir, file.path);
await mkdir(dirname(fullPath), { recursive: true });
await writeFile(fullPath, file.content);
```
**Suggested fix:** Validate that `resolve(outputDir, file.path)` starts with `resolve(outputDir)`.

---

### MEDIUM-001 — Temp file path predictable and non-unique
**File:** `src/assets/manager.ts:208`
**Severity:** MEDIUM
**Description:** Download temp files use a static `.tmp` suffix. Two concurrent downloads to the same destination would clobber each other's temp files.
**Impact:** Race condition leading to corrupted downloads in concurrent use.
**Evidence:**
```ts
const tmpPath = destPath + '.tmp';
```
**Suggested fix:** Use a unique suffix (e.g., `.tmp.${process.pid}.${Date.now()}`).

---

### MEDIUM-002 — JSON.parse of remote manifest without schema validation
**File:** `src/assets/manager.ts:248`
**Severity:** MEDIUM
**Description:** `fetchJson` parses remote JSON and casts to the expected type without runtime validation. A tampered manifest could have unexpected structure.
**Impact:** Unexpected crashes or behavior from malformed manifest data.
**Evidence:**
```ts
return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T;
```
**Suggested fix:** Use a runtime schema validator (e.g., zod) for the `AssetManifest` type.

---

### MEDIUM-003 — JSON.parse of user-provided batch config without validation
**File:** `src/character/batch.ts:31`
**Severity:** MEDIUM
**Description:** Batch config files are parsed from user-provided paths without schema validation.
**Impact:** Arbitrary shapes passed into the compositor could cause crashes or unexpected behavior.
**Evidence:**
```ts
const config = JSON.parse(await readFile(configPath, 'utf-8'));
```
**Suggested fix:** Validate the parsed config against the expected schema before processing.

---

### MEDIUM-004 — Gumroad product ID leaked in source code
**File:** `src/license.ts:269`
**Severity:** MEDIUM
**Description:** The Gumroad product ID `-2jxD5LR4p_tXnvxMiWU7g==` is visible in source. This reveals the exact product configuration.
**Impact:** Attacker can query Gumroad API for product details and potentially test key generation.
**Evidence:**
```ts
product_id: process.env.LPC_FORGE_PRODUCT_ID ?? '-2jxD5LR4p_tXnvxMiWU7g==',
```
**Suggested fix:** While necessary for Gumroad API calls, consider server-side proxy.

---

### MEDIUM-005 — 30-day grace period allows extended offline piracy
**File:** `src/license.ts:113`
**Severity:** MEDIUM
**Description:** A valid license is cached for 30 days without re-verification. Combined with offline activation, a forged license works for a full month.
**Impact:** Extended window for piracy before detection.
**Evidence:**
```ts
if (daysSinceVerify > 30) {
```
**Suggested fix:** Reduce grace period and require at least one successful online verification.

---

### MEDIUM-006 — Network errors treated as valid during re-verification
**File:** `src/license.ts:121-124`
**Severity:** MEDIUM
**Description:** When re-verification fails due to network errors, the license remains valid. An attacker can block Gumroad API access to prevent license revocation indefinitely.
**Impact:** Firewall-based bypass of license revocation.
**Evidence:**
```ts
// 'valid' or 'network_error' — both count as OK (grace period)
if (revalidated === 'valid') {
    await updateLastVerified(license);
}
```
**Suggested fix:** Track consecutive network failures and eventually require online verification.

---

### MEDIUM-007 — No sanitization of user input in Godot project name
**File:** `src/export/godot.ts:382`
**Severity:** MEDIUM
**Description:** `projectName` is interpolated directly into the generated `project.godot` file. Characters like `"`, `\n`, or `[` could break the INI-format config.
**Impact:** Malformed Godot project files that fail to open.
**Evidence:**
```ts
config/name="${projectName}"
```
**Suggested fix:** Escape or sanitize `projectName` for Godot INI format.

---

### LOW-001 — License file permissions set to 0o600 but only on Unix
**File:** `src/license.ts:205`
**Severity:** LOW
**Description:** File mode `0o600` is set for the license file, but this has no effect on Windows.
**Impact:** License file readable by other users on Windows systems.
**Evidence:**
```ts
await writeFile(LICENSE_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
```
**Suggested fix:** Use Windows ACLs on win32 platform.

---

### LOW-002 — Error messages leak internal paths
**File:** `src/assets/manager.ts:468-472`
**Severity:** LOW
**Description:** Error messages include full filesystem paths (e.g., `/home/user/.local/share/lpc-forge/assets/spritesheets/`).
**Impact:** Information disclosure of user directory structure.
**Evidence:**
```ts
`  Expected: ${join(assetDir, 'spritesheets/')} and ${join(assetDir, 'sheet_definitions/')}\n`
```
**Suggested fix:** Use relative or anonymized paths in user-facing error messages.

---

### LOW-003 — `readFileSync` blocks event loop at startup
**File:** `src/cli.ts:14`
**Severity:** LOW
**Description:** `readFileSync` is used to read `package.json` at module top level, blocking the event loop during startup.
**Impact:** Minor latency on slower filesystems; blocks all other startup tasks.
**Evidence:**
```ts
const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf-8'));
```
**Suggested fix:** Use async `readFile` or cache the version string at build time.

---

### LOW-004 — Disk space check skipped entirely on Windows
**File:** `src/assets/manager.ts:497`
**Severity:** LOW
**Description:** `checkDiskSpace` only runs `df` on Unix. Windows users get no disk space warning before a potentially 1.3 GB download.
**Impact:** Windows users may run out of disk space mid-download with no warning.
**Evidence:**
```ts
if (platform() !== 'win32') {
    const { stdout } = await execFileAsync('df', ['-k', dir]);
```
**Suggested fix:** Use `wmic` or PowerShell `Get-PSDrive` on Windows for equivalent check.

---

### INFO-001 — License comment acknowledges trivial bypassability
**File:** `src/license.ts:9-15`
**Severity:** INFO
**Description:** The code comments explicitly acknowledge that the license system is not meant to be "uncrackable" and optimizes for the "honest middle."
**Evidence:**
```ts
/**
 * HMAC signing key derived from a combination of factors.
 * This isn't meant to be uncrackable — it's a Node CLI tool, the source is
 * open. The goal is to make casual bypass inconvenient enough that buying
 * $10 is easier. Determined crackers will always win; we optimize for the
 * honest middle.
 */
```

---

### INFO-002 — Save data stored as unencrypted JSON
**File:** `src/systems/save-load.ts:38-44` (generated GDScript)
**Severity:** INFO
**Description:** Generated save system stores game state as plain JSON in `user://saves/`. This allows trivial save editing.
**Impact:** Players can cheat by editing save files. Acceptable for single-player games.

---

## 2. Bugs & Logic Errors

### HIGH-007 — `hexToRGBA` ignores alpha channel, makes transparent colors opaque
**File:** `src/ui/generator.ts:7-15`
**Severity:** HIGH
**Description:** `hexToRGBA` parses only 6 hex characters and hardcodes `alpha: 255`. When `'#00000000'` is passed (intending fully transparent), it returns opaque black. This affects all UI elements using transparent backgrounds.
**Impact:** UI panels, buttons, and icons render with opaque black backgrounds instead of transparency.
**Evidence:**
```ts
function hexToRGBA(hex: string): { r: number; g: number; b: number; alpha: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    alpha: 255,  // Always opaque — ignores 8th-char alpha
  };
}
```
**Suggested fix:** Parse alpha from chars 6-8 when present; default to 255 only for 6-char hex.

---

### HIGH-008 — `hexToRGBA` duplicated in 3 files with same bug
**File:** `src/ui/icons.ts:6-8`, `src/ui/props.ts:6-8`
**Severity:** HIGH
**Description:** The same buggy `hexToRGBA` (always alpha=255) is copy-pasted into `icons.ts` and `props.ts`. The ring icon (line 274 in icons.ts) explicitly uses `'#00000000'` expecting transparency.
**Impact:** Multiple UI components produce incorrect alpha. Ring icon renders as solid black circle instead of ring.
**Suggested fix:** Extract to a shared utility; fix the alpha parsing.

---

### HIGH-009 — Generated `has_item()` returns bool but declares int return type
**File:** `src/systems/inventory.ts:97` (generated GDScript)
**Severity:** HIGH
**Description:** The generated GDScript function `has_item()` declares `-> int` return type but `return total >= amount` produces a `bool`. Godot 4 strict typing will warn or error.
**Impact:** Runtime type error in generated Godot inventory system.
**Evidence:**
```gdscript
func has_item(item_id: String, amount: int = 1) -> int:
    # ...
    return total >= amount  # bool, not int
```
**Suggested fix:** Change return type to `-> bool`.

---

### HIGH-010 — `Math.min/max(...spread)` crashes on large regions
**File:** `src/map/cellular.ts:100-103`
**Severity:** HIGH
**Description:** `Math.min(...r.cells.map(c => c.x))` spreads all cells as function arguments. V8's argument limit is ~65,536. A region on a 300×300 map could have 90,000 cells, causing `RangeError: Maximum call stack size exceeded`.
**Impact:** Crash on large cave maps.
**Evidence:**
```ts
const minX = Math.min(...r.cells.map(c => c.x));
const maxX = Math.max(...r.cells.map(c => c.x));
const minY = Math.min(...r.cells.map(c => c.y));
const maxY = Math.max(...r.cells.map(c => c.y));
```
**Suggested fix:** Use a `for` loop to compute min/max.

---

### HIGH-011 — `credits.count` is undefined — should be `credits.length`
**File:** `scripts/generate_sources.cjs:17`
**Severity:** HIGH
**Description:** Arrays in JavaScript have `.length`, not `.count`. `credits.count` is always `undefined` (falsy), so the early-return on line 18 never fires, and the single-credit branch on line 21 is never entered.
**Impact:** Credit generation logic always takes the multi-credit path, producing incorrect output for 0 or 1 credit entries.
**Evidence:**
```js
if (credits.count <= 0) return;  // never triggers
// ...
if (credits.count === 1) { ... } // never triggers
```
**Suggested fix:** Replace `credits.count` with `credits.length`.

---

### HIGH-012 — GDScript indentation mixing `\t` escapes with literal tabs
**File:** `src/export/godot.ts:487-490`
**Severity:** HIGH
**Description:** The generated player script mixes `\t` escape sequences (used throughout the template) with literal tab characters in the spawn-point section. This creates inconsistent indentation in the generated GDScript.
**Impact:** Potential GDScript parse errors in generated Godot projects.
**Suggested fix:** Use consistent `\t` escape sequences throughout the template string.

---

### HIGH-013 — `creditToUse.notes.replaceAll()` crashes on undefined notes
**File:** `scripts/generate_sources.cjs:300`
**Severity:** HIGH
**Description:** `creditToUse.notes.replaceAll('"', "**")` will throw `TypeError: Cannot read properties of undefined` when `notes` is undefined or null.
**Impact:** Build script crash during source generation.
**Suggested fix:** Add null check: `(creditToUse.notes ?? '').replaceAll(...)`.

---

### HIGH-014 — Null dereference on `listCreditToUse.licenses`
**File:** `scripts/generate_sources.cjs:324`
**Severity:** HIGH
**Description:** `listCreditToUse` can be `null` (set on line 246 when no credits found), and accessing `.licenses` on null throws a TypeError.
**Impact:** Build script crash during source generation for uncredited items.
**Suggested fix:** Add null guard before accessing `listCreditToUse.licenses`.

---

### MEDIUM-008 — `randomInt` called with inverted range on small BSP partitions
**File:** `src/map/dungeon.ts:79-82`
**Severity:** MEDIUM
**Description:** When a BSP partition is smaller than expected, `rng.randomInt(roomMinSize, Math.min(roomMaxSize, node.w - 2))` can have `min > max`. Behavior depends on `SeededRNG.randomInt` implementation.
**Impact:** Invalid room dimensions or crash on small map sizes.
**Suggested fix:** Guard with `Math.max(min, max)`.

---

### MEDIUM-009 — `pick()` on empty array returns undefined
**File:** `src/utils/rng.ts:50-51`
**Severity:** MEDIUM
**Description:** `pick(array)` computes `array[this.randomInt(0, array.length - 1)]`. For an empty array, this becomes `array[-1]` which returns `undefined`.
**Impact:** Downstream code receives `undefined` without warning, causing cryptic errors later.
**Suggested fix:** Throw or return a sentinel value when array is empty.

---

### MEDIUM-010 — `setPixel` missing upper `y` bounds check
**File:** `src/ui/generator.ts:40`
**Severity:** MEDIUM
**Description:** `setPixel` checks `x < 0 || y < 0 || x >= width` but does not check `y >= height`. The `idx + 3 >= buf.length` fallback catches most cases but allows negative index computation for certain `y` values.
**Impact:** Silent pixel writes to wrong positions, or undefined behavior with negative indices.
**Evidence:**
```ts
if (x < 0 || y < 0 || x >= width) return; // no y >= height check
```
**Suggested fix:** Add `|| y >= height` to the guard condition.

---

### MEDIUM-011 — Overlapping `setPixel` bug duplicated in 3 files
**File:** `src/ui/icons.ts:21-23`, `src/ui/props.ts:20-21`
**Severity:** MEDIUM
**Description:** The same missing `y >= height` bounds check from `generator.ts` is copy-pasted into `icons.ts` and `props.ts`.
**Impact:** All three UI modules share the same out-of-bounds pixel write risk.
**Suggested fix:** Extract shared utility with complete bounds check.

---

### MEDIUM-012 — `extractAllPortraits` is a stub returning empty array
**File:** `src/ui/portrait.ts:81-89`
**Severity:** MEDIUM
**Description:** Function is exported as public API but always returns `[]`. Consumers calling this function get no portraits and no error.
**Impact:** Silent failure for any code depending on portrait extraction.
**Suggested fix:** Either implement the function or remove it from the public API.

---

### MEDIUM-013 — Door position out of bounds in town generator
**File:** `src/map/town.ts:140-141`
**Severity:** MEDIUM
**Description:** `tiles[by + bh - 1][doorX]` checks `by + bh - 1 < height` for y-axis but has no check that `doorX < width`.
**Impact:** Array index out-of-bounds crash if door x-coordinate exceeds map width.
**Suggested fix:** Add `doorX >= 0 && doorX < width` guard.

---

### MEDIUM-014 — WFC fallback silently fills entire map with grass
**File:** `src/map/wfc.ts:115-119`
**Severity:** MEDIUM
**Description:** After `maxRetries` WFC collapse failures, the map is filled entirely with GRASS tiles. No rooms, POIs, spawn, or exit are placed. No warning or error is raised.
**Impact:** Users receive a featureless grass map with no indication of failure.
**Suggested fix:** Throw an error or log a warning when WFC exhausts all retries.

---

### MEDIUM-015 — Async function with no await in multifloor generator
**File:** `src/map/multifloor.ts:26`
**Severity:** MEDIUM
**Description:** `generateMultiFloor` is marked `async` but `generateDungeon` (the only substantive call) is synchronous. The `async` keyword adds unnecessary Promise wrapping overhead.
**Impact:** Misleading API — callers must `await` needlessly.
**Suggested fix:** Remove `async` and return plain `MultiFloorDungeon`.

---

### MEDIUM-016 — `writeFileSync` called with callback argument (noop)
**File:** `scripts/zPositioning/update_zpos.js:27`
**Severity:** MEDIUM
**Description:** `fs.writeFileSync` does not accept a callback third argument. The callback is silently ignored.
**Impact:** Error handling intended by the callback never executes.
**Suggested fix:** Remove the callback or use async `fs.writeFile`.

---

### MEDIUM-017 — Overly broad `includes()` match for zPos CSV lookup
**File:** `scripts/zPositioning/update_zpos.js:24`
**Severity:** MEDIUM
**Description:** `item.includes(file.name)` matches filenames as substrings. `"hat"` would match `"that"`, `"shatter"`, etc.
**Impact:** Wrong zPos values assigned to definitions with overlapping names.
**Suggested fix:** Use exact filename matching or a more precise delimiter-aware comparison.

---

### MEDIUM-018 — `forEach` return value assigned to variable
**File:** `scripts/zPositioning/update_zpos.js:12`
**Severity:** MEDIUM
**Description:** `const sheets = fs.readdirSync(...).forEach(...)` — `forEach` returns `undefined`, so `sheets` is always `undefined`.
**Impact:** Dead variable; indicates possible logic error if `sheets` was intended to hold results.
**Suggested fix:** Use `.map()` instead of `.forEach()` if the intent is to collect results.

---

### MEDIUM-019 — XP rewards defined but never granted
**File:** `src/systems/quest.ts:88` (generated GDScript)
**Severity:** MEDIUM
**Description:** Quest reward definitions include `"xp"` fields (lines 26, 35, 43) but `_grant_rewards` only processes `"items"`. XP is silently discarded.
**Impact:** Players never receive XP from quest completion in generated games.
**Suggested fix:** Add XP granting logic to `_grant_rewards`.

---

### MEDIUM-020 — Loot table references undefined `"emerald"` item
**File:** `src/systems/loot.ts:34` (generated GDScript)
**Severity:** MEDIUM
**Description:** The chest loot table includes `{"item": "emerald", ...}` but the inventory's `_item_database` does not define an `"emerald"` entry. `add_item("emerald", ...)` silently fails.
**Impact:** Players can never receive emeralds from chests despite it appearing in loot tables.
**Suggested fix:** Add `"emerald"` to the inventory item database or remove from loot tables.

---

### MEDIUM-021 — `Engine.has_singleton("Inventory")` is dead code in Godot 4
**File:** `src/systems/save-load.ts:116` (generated GDScript)
**Severity:** MEDIUM
**Description:** Autoloads in Godot 4 are scene tree nodes, not Engine singletons. `Engine.has_singleton("Inventory")` always returns `false`. The fallback `get_node_or_null("/root/Inventory")` works correctly, making this check useless.
**Impact:** Dead code path that confuses maintainers.
**Suggested fix:** Remove the `Engine.has_singleton` check; use only `get_node_or_null`.

---

### LOW-005 — Pool placement range inverted for small maps
**File:** `src/map/cellular.ts:242-243`
**Severity:** LOW
**Description:** `rng.randomInt(5, width - 5)` produces invalid range when `width < 10`.
**Impact:** Crash or invalid pool placement on small cave maps.
**Suggested fix:** Guard minimum map size or clamp range.

---

### LOW-006 — Village NPC placed at `x + 1` without bounds check
**File:** `src/map/overworld.ts:70`
**Severity:** LOW
**Description:** NPC placed at `villages[i].x + 1` which can equal `width` if village is at the map edge.
**Impact:** Array index out-of-bounds for edge-case village placement.
**Suggested fix:** Clamp to `Math.min(villages[i].x + 1, width - 1)`.

---

### LOW-007 — Treasure and NPC probabilities not configurable
**File:** `src/map/dungeon.ts:227,237`
**Severity:** LOW
**Description:** Treasure probability `0.3` and NPC probability `0.2` are hardcoded literals.
**Impact:** Users cannot tune generation parameters through the config API.
**Suggested fix:** Add `treasureProbability` and `npcProbability` to `DungeonConfig`.

---

### LOW-008 — `biomes` config field defined but never consumed
**File:** `src/map/types.ts:22`, `src/map/overworld.ts`
**Severity:** LOW
**Description:** `OverworldConfig` defines `biomes?: string[]` but the overworld generator never reads it.
**Impact:** Misleading API — users set `biomes` expecting it to work, but it's silently ignored.
**Suggested fix:** Either implement biome filtering or remove the field.

---

### LOW-009 — Non-stackable items silently discard extra quantity
**File:** `src/systems/inventory.ts:77` (generated GDScript)
**Severity:** LOW
**Description:** When `add_item("gold_key", 3)` is called for a non-stackable item, amount is set to `1` and only one key is added. The remaining 2 are silently discarded.
**Impact:** Items lost without warning.
**Suggested fix:** Return the number of items actually added, or attempt to add multiple individual stacks.

---

### LOW-010 — `sorted_keys()` called every frame in day-night system
**File:** `src/systems/day-night.ts:51` (generated GDScript)
**Severity:** LOW
**Description:** The day-night `_process` function calls `time_colors.keys()` and sorts them every frame. This allocates and sorts an array ~60 times per second.
**Impact:** Unnecessary GC pressure and CPU usage in the game loop.
**Suggested fix:** Cache the sorted keys array in `_ready`.

---

### LOW-011 — Credits matching uses bidirectional `includes` — false positives
**File:** `src/utils/credits.ts:67`
**Severity:** LOW
**Description:** `p.includes(c.file) || c.file.includes(p)` matches substrings bidirectionally. Short filenames like `"a"` match nearly everything.
**Impact:** Incorrect credit attributions for assets with short names.
**Suggested fix:** Use exact path comparison or prefix matching.

---

### LOW-012 — Tween animates local position but sets global position
**File:** `src/systems/loot.ts:95-96` (generated GDScript)
**Severity:** LOW
**Description:** Loot pickup's `global_position` is set initially, but tween targets `position` (local). If parent has non-zero position, animation coordinates are wrong.
**Impact:** Loot pickup animation plays at incorrect position.
**Suggested fix:** Use `global_position` consistently, or parent to a root-level node.

---

### INFO-003 — Hardcoded portrait crop dimensions
**File:** `src/ui/portrait.ts:42`
**Severity:** INFO
**Description:** Portrait extraction uses `left: 12, top: 0, width: 40, height: 44` hardcoded for LPC 64×64 frames. If frame size changes, portraits will be wrong.

---

### INFO-004 — Default dialog `"next": 3` points to out-of-bounds index
**File:** `src/systems/dialog.ts:238-240` (generated GDScript)
**Severity:** INFO
**Description:** Default dialog choices reference index 3 in a 3-element array (valid indices 0-2). This ends the dialog, which works but is fragile and unclear.

---

## 3. Code Quality & Optimization

### HIGH-015 — `hexToRGBA`, `setPixel`, `fillRect` duplicated across 3 files
**File:** `src/ui/generator.ts`, `src/ui/icons.ts`, `src/ui/props.ts`
**Severity:** HIGH
**Description:** Core pixel manipulation utilities are copy-pasted into three separate files. Each copy has the same alpha bug (CRITICAL) and missing bounds check.
**Impact:** Bug fixes must be applied in 3 places. DRY violation increases maintenance cost.
**Suggested fix:** Extract to `src/ui/pixel-utils.ts` and import.

---

### HIGH-016 — Dual ESLint configs — legacy `.eslintrc.js` and flat `eslint.config.js`
**File:** `.eslintrc.js`, `eslint.config.js`
**Severity:** HIGH
**Description:** Two conflicting ESLint configurations exist. The flat config ignores the legacy config, but the legacy config references `@babel/eslint-parser` which isn't in `devDependencies`.
**Impact:** Confusing for contributors; `@babel/eslint-parser` would fail if used; dead configuration code.
**Suggested fix:** Delete `.eslintrc.js`.

---

### MEDIUM-022 — `no-unused-vars` rule disabled globally
**File:** `eslint.config.js:11`
**Severity:** MEDIUM
**Description:** `'@typescript-eslint/no-unused-vars': 'off'` suppresses all unused variable warnings across the entire codebase.
**Impact:** Dead code accumulates undetected (e.g., unused `rng` in multifloor.ts, unused `dirname` in registry.ts).
**Suggested fix:** Enable with `argsIgnorePattern: '^_'` to allow intentional underscored params.

---

### MEDIUM-023 — `existsSync` used throughout async code paths
**File:** `src/assets/manager.ts:113,122,123,463,464`, `src/character/composer.ts:219,222`
**Severity:** MEDIUM
**Description:** Synchronous `existsSync` calls are scattered throughout otherwise async functions, blocking the event loop.
**Impact:** Degrades performance and responsiveness, especially when checking multiple paths.
**Suggested fix:** Use `stat` with try/catch or `access` from `fs/promises`.

---

### MEDIUM-024 — Unused `rng` variable instantiated in multifloor
**File:** `src/map/multifloor.ts:35`
**Severity:** MEDIUM
**Description:** `const rng = new SeededRNG(seed)` is created but never used. Each floor creates its own seed via string template.
**Impact:** Dead code; `SeededRNG` import is also unused.
**Suggested fix:** Remove the import and variable.

---

### MEDIUM-025 — Unused `dirname` import in tileset registry
**File:** `src/tileset/registry.ts:2`
**Severity:** MEDIUM
**Description:** `dirname` is imported from `node:path` but never referenced.
**Impact:** Dead import.
**Suggested fix:** Remove the import.

---

### MEDIUM-026 — Dead `meta` variable in Godot exporter
**File:** `src/export/godot.ts:351`
**Severity:** MEDIUM
**Description:** A `Record<string, string>` named `meta` is constructed but never used. POI metadata is written directly via string interpolation instead.
**Impact:** Dead code; confusing for maintainers.
**Suggested fix:** Remove the `meta` variable.

---

### MEDIUM-027 — Unused `GodotExportOptions` and `TilesetExportOptions` types
**File:** `src/export/types.ts:1-13`
**Severity:** MEDIUM
**Description:** Both interfaces are defined but not imported or used anywhere. The actual Godot export functions define their options inline.
**Impact:** Dead type definitions; misleading public API.
**Suggested fix:** Remove the file or align the types with actual usage.

---

### MEDIUM-028 — `createRequire` / `require('jsfxr')` called inside function body
**File:** `src/audio/sfx-generator.ts:7,24`
**Severity:** MEDIUM
**Description:** `createRequire` is used at module level but `require('jsfxr')` is called inside `generateWavBuffer`. While Node caches the result, this pattern is unusual for ESM and has no try/catch.
**Impact:** Unhelpful error if `jsfxr` is missing; non-idiomatic ESM/CJS interop.
**Suggested fix:** Import at module level with try/catch for a better error message.

---

### MEDIUM-029 — `JSON.stringify` for object comparison
**File:** `scripts/generate_sources.cjs:283-291`
**Severity:** MEDIUM
**Description:** Objects are compared via `JSON.stringify(a) === JSON.stringify(b)`. Key ordering differences cause false mismatches.
**Impact:** Incorrect duplicate detection in source generation.
**Suggested fix:** Use deep-equality comparison or sort keys before serializing.

---

### MEDIUM-030 — Silent error swallowing in definition loader
**File:** `src/character/definitions.ts:50-52`
**Severity:** MEDIUM
**Description:** Invalid JSON files in `sheet_definitions/` are caught and silently skipped with no logging.
**Impact:** Broken definition files are invisible to users; assets silently missing.
**Evidence:**
```ts
} catch {
    // Skip invalid JSON files
}
```
**Suggested fix:** Log a warning with the file path when skipping.

---

### MEDIUM-031 — `child_process.fork()` runs unconditionally on module load
**File:** `scripts/generate_sources.cjs:8`
**Severity:** MEDIUM
**Description:** `require("child_process").fork("scripts/zPositioning/parse_zpos.cjs")` executes as a side effect of requiring the module. This spawns a child process even if the main script hasn't been set up yet.
**Impact:** Unexpected child process on import; potential race condition with parent.
**Suggested fix:** Move the fork inside a main function or guard with a condition.

---

### LOW-013 — `var` used instead of `const`/`let` throughout CJS scripts
**File:** `scripts/zPositioning/parse_zpos.cjs:5`, `scripts/zPositioning/update_zpos.js:21`
**Severity:** LOW
**Description:** `var csvEntries`, `var entryIdx`, etc. used in scripts instead of `const`/`let`.
**Impact:** Variable hoisting could cause subtle bugs; outdated style.
**Suggested fix:** Use `const` or `let`.

---

### LOW-014 — Dynamic import of `chalk` and `ora` in every CLI command
**File:** `src/cli.ts:55-56` (repeated in ~15 commands)
**Severity:** LOW
**Description:** Every CLI command action starts with `const chalk = (await import('chalk')).default; const ora = (await import('ora')).default;`. This pattern is repeated 15+ times.
**Impact:** Code duplication; slightly slower cold starts for each command.
**Suggested fix:** Hoist to a shared utility or import once at the top.

---

### LOW-015 — `findDefinition` partial matching can return wrong definitions
**File:** `src/character/definitions.ts:134`
**Severity:** LOW
**Description:** `key.includes(subcategory)` does substring matching. Searching for `"plate"` would match `"plate_armor"` but also `"template"`.
**Impact:** Wrong definition returned for ambiguous subcategory names.
**Suggested fix:** Use word-boundary matching or exact path component comparison.

---

### LOW-016 — `join(outputPath, '..')` instead of `dirname(outputPath)`
**File:** `src/tileset/atlas.ts:45`, `src/tileset/terrain.ts:49`
**Severity:** LOW
**Description:** `join(outputPath, '..')` computes the parent directory. `dirname(outputPath)` is the canonical idiom.
**Impact:** Code smell; `dirname` is clearer and handles edge cases better.
**Suggested fix:** Use `dirname(outputPath)`.

---

### LOW-017 — Systems re-generated from scratch for each dependency resolution
**File:** `src/systems/index.ts:56`
**Severity:** LOW
**Description:** `getSystem(dep)` calls the generator function again for each dependency, creating duplicate `GameSystem` objects. In a deep dependency tree, the same system could be generated multiple times.
**Impact:** Wasted computation; no functional bug due to deduplication by name.
**Suggested fix:** Use a memoization cache for resolved systems.

---

### LOW-018 — `UI_THEMES` exported from two modules under different names
**File:** `src/ui/index.ts:1-2`
**Severity:** LOW
**Description:** Barrel export re-exports `UI_THEMES` from `generator.js` and also exports everything from `themes.js` which also contains `UI_THEMES`.
**Impact:** Two paths to the same object; confusing API surface.
**Suggested fix:** Export from one canonical location.

---

### LOW-019 — Animation loop list hardcoded in Godot exporter
**File:** `src/export/godot.ts:91`
**Severity:** LOW
**Description:** `const loop = animName === 'walk' || animName === 'idle' || animName === 'run' || animName === 'combat_idle'` — adding new looping animations requires modifying this condition.
**Impact:** New animations default to non-looping.
**Suggested fix:** Add a `loop` property to the `ANIMATIONS` constant in `types.ts`.

---

### LOW-020 — Raw numeric tile type literals instead of enum references
**File:** `src/export/godot.ts:232`
**Severity:** LOW
**Description:** `t !== 2 && t !== 7` uses raw numbers instead of `TileType.WALL` and `TileType.TREE` enum values.
**Impact:** Silently breaks if TileType enum values change.
**Suggested fix:** Import and use `TileType` enum.

---

### LOW-021 — Hardcoded player speed and health in Godot exporter
**File:** `src/export/godot.ts:472`
**Severity:** LOW
**Description:** `SPEED = 200.0` and `MAX_HEALTH = 100` are hardcoded in the generated player script.
**Impact:** Not configurable through the export API.
**Suggested fix:** Add `playerSpeed` and `playerHealth` to export options.

---

### LOW-022 — Data URI split assumes specific format
**File:** `src/audio/sfx-generator.ts:34`
**Severity:** LOW
**Description:** `dataUri.split(',')[1]` assumes the data URI contains exactly one comma. A base64 value containing a comma would be truncated.
**Impact:** Rare edge case; jsfxr data URIs are well-formatted, but fragile for future changes.
**Suggested fix:** Use `dataUri.substring(dataUri.indexOf(',') + 1)`.

---

### LOW-023 — All music catalog entries defer attribution to CREDITS.md
**File:** `src/audio/music-catalog.ts:13-88`
**Severity:** LOW
**Description:** Every entry has `artist: "See CREDITS.md"` and `sourceUrl: "https://opengameart.org"` (generic, not specific pages).
**Impact:** No direct attribution; relies on external file for compliance with CC-BY/OGA-BY licenses.
**Suggested fix:** Add specific artist names and URL paths.

---

### LOW-024 — Silent catch in tileset atlas
**File:** `src/tileset/atlas.ts:40-42`
**Severity:** LOW
**Description:** `sharp(filePath)` failures are silently caught. Missing tiles produce no warning.
**Impact:** Tileset atlas missing tiles with no diagnostic.
**Suggested fix:** Log a warning with the failed file path.

---

### LOW-025 — Silent catch in terrain renderer
**File:** `src/tileset/terrain.ts:24-26`
**Severity:** LOW
**Description:** Tile image load failures silently swallowed.
**Impact:** Rendered map has transparent holes with no diagnostic.
**Suggested fix:** Log a warning.

---

### LOW-026 — `path.split('/').pop()` — assumes Unix path separator
**File:** `src/character/definitions.ts:91`
**Severity:** LOW
**Description:** Uses `/` as separator instead of `path.sep` or `path.basename()`. On Windows with backslash paths, the full path would be returned as the filename.
**Impact:** Wrong definition names on Windows.
**Suggested fix:** Use `path.basename(filePath, '.json')`.

---

### INFO-005 — Unused `AnimationPlayer` declared in scene transitions
**File:** `src/systems/scene-transition.ts:14` (generated GDScript)
**Severity:** INFO
**Description:** `@onready var anim_player` is declared but never used; transitions use Tween objects instead.

---

### INFO-006 — `capitalize()` function likely duplicated
**File:** `src/export/godot.ts:613`
**Severity:** INFO
**Description:** Simple `capitalize()` helper may be duplicated elsewhere in the codebase.

---

### INFO-007 — Tileset manifest parsed without schema validation
**File:** `src/tileset/registry.ts:78`
**Severity:** INFO
**Description:** `JSON.parse(content) as TilesetManifest` does no runtime validation.

---

### INFO-008 — `color_ramp = null` in particle preset is not valid Godot syntax
**File:** `src/lighting/particles.ts:90`
**Severity:** INFO
**Description:** `.tscn` format doesn't support `null` for `color_ramp`. Godot may ignore or error on this property.

---

### INFO-009 — Hardcoded hurtbox dimensions not derived from frame size
**File:** `src/export/godot.ts:129`
**Severity:** INFO
**Description:** Hurtbox `Vector2(24, 32)` is hardcoded rather than derived from `FRAME_SIZE`.

---

### INFO-010 — Sub-resource referenced before definition in lighting .tscn
**File:** `src/lighting/index.ts:43,45`
**Severity:** INFO
**Description:** `SubResource("light_grad")` appears on line 43 but the sub-resource is defined on line 45. Godot .tscn expects definition-before-use.

---

## 4. CI/CD & Build Issues

### HIGH-017 — `tar` commands may fail in CI when LFS directories are missing
**File:** `.github/workflows/release-assets.yml:28-29`
**Severity:** HIGH
**Description:** The release workflow creates tar archives from `spritesheets/body/`, `spritesheets/shadow/`, etc. With `lfs: false` on line 17, LFS-tracked directories may be empty or missing, causing `tar` to fail under `set -euo pipefail`.
**Impact:** Release workflow fails silently or aborts, preventing asset package distribution.
**Suggested fix:** Add existence checks before tar commands or enable LFS checkout.

---

### HIGH-018 — `exit -1` is non-portable
**File:** `.github/workflows/validate-site-sources.yml:45`
**Severity:** HIGH
**Description:** `exit -1` is not POSIX-compliant. Many shells interpret this as `exit 255` but behavior is undefined.
**Impact:** Workflow may report incorrect exit status.
**Suggested fix:** Use `exit 1`.

---

### MEDIUM-032 — Unnecessarily broad `security-events: write` permission
**File:** `.github/workflows/validate-site-sources.yml:17`
**Severity:** MEDIUM
**Description:** `security-events: write` permission is declared but the workflow only runs node scripts and git diff. This permission is never used.
**Impact:** Violates principle of least privilege for CI tokens.
**Suggested fix:** Remove `security-events: write`.

---

### MEDIUM-033 — Testing against unreleased Node.js 24
**File:** `.github/workflows/ci.yml:14`
**Severity:** MEDIUM
**Description:** CI matrix includes Node.js 24 which is not a stable release. This may cause spurious CI failures.
**Impact:** False negatives in CI results; blocks PRs due to experimental Node bugs.
**Suggested fix:** Replace with Node 20 LTS or wait for Node 24 stability.

---

### MEDIUM-034 — Dead deprecated workflow file
**File:** `.github/workflows/lint.yml`
**Severity:** MEDIUM
**Description:** 13-line workflow only triggers on `workflow_dispatch` and contains a deprecation comment. Dead code in the CI configuration.
**Impact:** Confusing for contributors; clutters workflow list.
**Suggested fix:** Delete the file.

---

### MEDIUM-035 — GitHub Actions unpinned to SHA
**File:** `.github/workflows/release-assets.yml`
**Severity:** MEDIUM
**Description:** `softprops/action-gh-release@v2` uses a mutable tag rather than a pinned SHA. A compromised action version could exfiltrate secrets.
**Impact:** Supply chain risk for release workflow.
**Suggested fix:** Pin to full commit SHA: `softprops/action-gh-release@<sha>`.

---

### LOW-027 — `package.json` `"files"` and `.npmignore` both exist
**File:** `package.json`, `.npmignore`
**Severity:** LOW
**Description:** Both `"files"` allowlist in `package.json` and `.npmignore` denylist exist. npm uses `"files"` when present and `.npmignore` is partially redundant.
**Impact:** Confusion about which mechanism controls package contents; potential drift.
**Suggested fix:** Choose one mechanism and document it.

---

### LOW-028 — Description says "Godot 4.6" — version doesn't exist
**File:** `package.json:4`
**Severity:** LOW
**Description:** Package description mentions "Godot 4.6" but the latest Godot 4.x is 4.4. The generated code targets Godot 4.x generically.
**Impact:** Misleading version claim to users.
**Suggested fix:** Change to "Godot 4" or the actual minimum supported version.

---

### LOW-029 — `tsconfig.json` exclude doesn't cover `scripts/`
**File:** `tsconfig.json:16`
**Severity:** LOW
**Description:** The `exclude` array includes `"tests"` but not `"scripts"`. The `rootDir: "src"` setting prevents compilation issues, but the exclusion list is incomplete.
**Impact:** Potential confusion if rootDir constraint is removed.
**Suggested fix:** Add `"scripts"` to `exclude`.

---

### LOW-030 — Legacy `.eslintrc.js` references missing `@babel/eslint-parser`
**File:** `.eslintrc.js:5`
**Severity:** LOW
**Description:** References `@babel/eslint-parser` parser which is not in `devDependencies`.
**Impact:** Running this config directly would crash ESLint.
**Suggested fix:** Delete `.eslintrc.js` entirely (see HIGH-016).

---

### INFO-011 — No version pinning for checkout action
**File:** `.github/workflows/ci.yml`
**Severity:** INFO
**Description:** `actions/checkout@v4` uses mutable tag. Lower risk than third-party actions but still a supply chain consideration.

---

### INFO-012 — No branch protection documented
**File:** Repository level
**Severity:** INFO
**Description:** No evidence of branch protection rules for `master`. Any contributor could push directly.

---

### INFO-013 — `npm-publish.yml` uses `id-token: write` correctly
**File:** `.github/workflows/npm-publish.yml`
**Severity:** INFO
**Description:** OIDC token permission for npm provenance is correctly configured. Good practice.

---

## 5. Asset Pipeline

### HIGH-019 — No input validation on `DownloadOptions.path`
**File:** `src/assets/manager.ts:367`
**Severity:** HIGH
**Description:** `options.path ? resolve(options.path) : getAssetDir()` accepts any path. Combined with tar extraction, assets could be written to arbitrary locations specified by the user.
**Impact:** User-specified path with `--path` flag could target sensitive system directories.
**Suggested fix:** Validate path is within user-accessible directories.

---

### HIGH-020 — Git clone URL constructed from hardcoded constant without validation
**File:** `src/assets/manager.ts:310-314`
**Severity:** HIGH
**Description:** `git clone` URL is constructed from `GITHUB_REPO` constant. If an attacker could modify this constant (e.g., dependency injection), they could clone a malicious repo.
**Impact:** While the constant is hardcoded, the pattern lacks defense-in-depth.
**Suggested fix:** Validate the cloned content against expected checksums.

---

### HIGH-021 — No size limit on downloaded chunks
**File:** `src/assets/manager.ts:413-424`
**Severity:** HIGH
**Description:** Downloads proceed without enforcing a maximum file size. A tampered manifest could specify multi-GB chunk sizes to fill disk.
**Impact:** Disk exhaustion denial-of-service.
**Suggested fix:** Enforce reasonable maximum size per chunk and total.

---

### MEDIUM-036 — `fetchJson` has no response size limit
**File:** `src/assets/manager.ts:242-249`
**Severity:** MEDIUM
**Description:** Response body is buffered entirely in memory with no size limit. A malicious server returning an extremely large JSON response could exhaust memory.
**Impact:** Out-of-memory crash.
**Suggested fix:** Add a maximum body size check during chunked reading.

---

### MEDIUM-037 — Retry delay hardcoded and aggressive
**File:** `src/assets/manager.ts:193`
**Severity:** MEDIUM
**Description:** `setTimeout(r, 3000 * (attempt + 1))` waits 3s then 6s. No jitter or exponential backoff.
**Impact:** Thundering herd if many users retry simultaneously against GitHub.
**Suggested fix:** Add jitter and exponential backoff.

---

### MEDIUM-038 — Local manifest not validated after parsing
**File:** `src/assets/manager.ts:119`
**Severity:** MEDIUM
**Description:** `JSON.parse(raw) as LocalManifest` does no runtime type checking. A corrupted manifest file could cause downstream crashes.
**Impact:** Crashes when accessing `manifest.version` or `manifest.chunks` on corrupted data.
**Suggested fix:** Add runtime validation of required fields.

---

### MEDIUM-039 — Git clone fallback has no checksum verification
**File:** `src/assets/manager.ts:316-325`
**Severity:** MEDIUM
**Description:** After git clone, copied files are not checksummed. A MitM on the git clone could inject modified assets.
**Impact:** Tampered sprite assets with no detection.
**Suggested fix:** Verify known file checksums after clone.

---

### MEDIUM-040 — `resolveAssetRoot` silently falls back to potentially empty cache dir
**File:** `src/assets/manager.ts:86-97`
**Severity:** MEDIUM
**Description:** When no env var is set and `spritesheets/` isn't found locally, `getAssetDir()` is returned even if assets aren't installed there. Downstream code discovers the missing assets much later.
**Impact:** Confusing error messages far from the root cause.
**Suggested fix:** Check for installed assets before returning cached path.

---

### LOW-031 — `downloadToFile` uses `join(destPath, '..')` for parent mkdir
**File:** `src/assets/manager.ts:206`
**Severity:** LOW
**Description:** `join(destPath, '..')` used instead of `dirname(destPath)`.
**Impact:** Cosmetic; `dirname` is the canonical idiom.
**Suggested fix:** Use `dirname(destPath)`.

---

### LOW-032 — Dynamic import of `rename` inside download function
**File:** `src/assets/manager.ts:220`
**Severity:** LOW
**Description:** `const { rename } = await import('node:fs/promises')` is called inside `downloadToFile` even though `fs/promises` is already imported at the module top level (line 9).
**Impact:** Redundant dynamic import; `rename` is not in the top-level destructure.
**Suggested fix:** Add `rename` to the top-level import.

---

### LOW-033 — Git clone timeout of 10 minutes may be too short for large repos
**File:** `src/assets/manager.ts:314`
**Severity:** LOW
**Description:** `timeout: 600_000` (10 minutes) for git clone on slow connections may not be enough for the full repository.
**Impact:** Timeout on slow connections with no resume capability.
**Suggested fix:** Consider a longer timeout or progress feedback.

---

### LOW-034 — Clone dir uses `Date.now()` for uniqueness — not collision-proof
**File:** `src/assets/manager.ts:304`
**Severity:** LOW
**Description:** `lpc-forge-clone-${Date.now()}` could collide if two processes start simultaneously.
**Impact:** Very unlikely race condition with directory collision.
**Suggested fix:** Add `process.pid` or random suffix.

---

### LOW-035 — `platform()` called per function invocation, not cached
**File:** `src/assets/manager.ts:67,497`
**Severity:** LOW
**Description:** `platform()` is called multiple times across functions. While cheap, it could be cached at module level.
**Impact:** Negligible perf; code smell.
**Suggested fix:** Cache result at module level.

---

### INFO-014 — `getAssetDir` correctly uses XDG_DATA_HOME
**File:** `src/assets/manager.ts:75`
**Severity:** INFO
**Description:** Linux asset dir respects `XDG_DATA_HOME` env var. Good practice.

---

### INFO-015 — SHA-256 checksum verification implemented for chunks
**File:** `src/assets/manager.ts:436-444`
**Severity:** INFO
**Description:** Downloaded chunks are verified against SHA-256 checksums from the manifest. Good practice.

---

## 6. Character Composition Engine

### HIGH-022 — Empty catch blocks silently swallow sprite load errors
**File:** `src/character/composer.ts:230,244`
**Severity:** HIGH
**Description:** When `sharp(animPath)` throws (corrupted PNG, broken symlink), the error is caught with no logging. Missing animation frames produce invisible gaps in the output spritesheet.
**Impact:** Corrupted character spritesheets with no diagnostic.
**Evidence:**
```ts
} catch {
    // Skip unreadable files
}
```
**Suggested fix:** Log a warning with the failing file path.

---

### HIGH-023 — Full PNG loaded into memory for every animation of every layer
**File:** `src/character/composer.ts:224,238`
**Severity:** HIGH
**Description:** Each animation PNG is loaded as a full `sharp` buffer. For a character with 10 layers × 15 animations, this is 150 full PNG decodes and buffers held simultaneously.
**Impact:** High memory usage; potential OOM on systems with limited RAM during batch generation.
**Suggested fix:** Use sharp's streaming pipeline or process layers sequentially with cleanup.

---

### MEDIUM-041 — Fallback body type chain is hardcoded
**File:** `src/character/composer.ts:168-173`
**Severity:** MEDIUM
**Description:** Body type fallback chains (`muscular→male`, `pregnant→female`, etc.) are hardcoded rather than configurable or derived from definitions.
**Impact:** Adding new body types requires code changes.
**Suggested fix:** Move fallback chains to configuration.

---

### MEDIUM-042 — `customAnimation` layers unconditionally skipped
**File:** `src/character/composer.ts:89`
**Severity:** MEDIUM
**Description:** `if (entry.customAnimation) continue;` skips all layers with custom animations (e.g., oversize attack sprites).
**Impact:** Some visual layers never appear in the composited spritesheet.
**Suggested fix:** Implement custom animation handling or document the limitation.

---

### MEDIUM-043 — Variant name space-to-underscore conversion may not match filenames
**File:** `src/character/composer.ts:214`
**Severity:** MEDIUM
**Description:** `layer.variant.replace(/ /g, '_')` converts spaces to underscores for filename lookup. If actual filenames use other conventions (hyphens, mixed case), the lookup fails silently.
**Impact:** Layers with multi-word variants may not be found.
**Suggested fix:** Case-insensitive file lookup or normalize consistently.

---

### MEDIUM-044 — No frame count validation in slicer
**File:** `src/character/slicer.ts`
**Severity:** MEDIUM
**Description:** The slicer uses `ANIMATIONS` constants (frame counts, rows) without validating that the source buffer actually has the expected dimensions. An undersized sprite sheet would produce corrupted frames.
**Impact:** Silent corruption of sliced frames if input dimensions don't match expectations.
**Suggested fix:** Validate input image dimensions match `SHEET_WIDTH × SHEET_HEIGHT`.

---

### MEDIUM-045 — Animation support check logic is complex and fragile
**File:** `src/character/composer.ts:196-211`
**Severity:** MEDIUM
**Description:** `supportsAnim` check involves multiple name mappings and triple-comparison (`mapped === animName || mapped === folderName || a === animName`). This is error-prone when adding new animations.
**Impact:** Animations may be incorrectly included or excluded.
**Suggested fix:** Simplify by normalizing all animation names to a canonical form.

---

### MEDIUM-046 — No batch size limit
**File:** `src/character/batch.ts`
**Severity:** MEDIUM
**Description:** Batch config files can specify unlimited characters. Each character loads dozens of PNG files into memory.
**Impact:** Memory exhaustion for large batch configs.
**Suggested fix:** Add a configurable batch size limit with a warning.

---

### LOW-036 — Slicer creates individual sharp instance per frame
**File:** `src/character/slicer.ts`
**Severity:** LOW
**Description:** Each frame extraction creates a new `sharp()` pipeline from the source buffer, re-decoding the PNG each time.
**Impact:** Inefficient for full sheet slicing (potentially 810 frames: 15 animations × 54 rows).
**Suggested fix:** Decode the PNG once and extract regions from the raw pixel buffer.

---

### LOW-037 — `ANIMATION_FOLDER_MAP` indirection adds complexity
**File:** `src/character/types.ts` + `src/character/composer.ts:197-208`
**Severity:** LOW
**Description:** Two-level animation name mapping (definition name → folder name via `ANIMATION_FOLDER_MAP`) is used throughout the compositor. This indirection is a common source of confusion.
**Impact:** Maintenance burden; new animations require updates in multiple places.
**Suggested fix:** Unify animation naming to use folder names directly.

---

### LOW-038 — Preset validation happens at runtime, not build time
**File:** `src/character/presets.ts`
**Severity:** LOW
**Description:** 17 character presets specify layers that are only validated when `composeCharacter` is called. A typo in a preset won't be caught until runtime.
**Impact:** Latent errors in presets discovered only during use.
**Suggested fix:** Add a build-time or test-time preset validation step.

---

### LOW-039 — No progress reporting for single character composition
**File:** `src/character/composer.ts:28-161`
**Severity:** LOW
**Description:** `composeCharacter` provides `verbose` console.log but no progress callback. For large layer counts, the user sees no progress.
**Impact:** Poor UX for complex characters that take several seconds.
**Suggested fix:** Add optional progress callback.

---

### LOW-040 — `listLayers` groups by first path component only
**File:** `src/character/definitions.ts:109`
**Severity:** LOW
**Description:** Category is derived from `key.split('/')[0]` which only captures the top-level directory. Nested categorizations are flattened.
**Impact:** All sub-levels appear under the same category in `--list-layers` output.
**Suggested fix:** Preserve full category hierarchy.

---

### INFO-016 — Compositor supports up to 20 sub-layers per definition
**File:** `src/character/definitions.ts:68`
**Severity:** INFO
**Description:** `for (let i = 1; i <= 20; i++)` limits layer inspection to 20. Unlikely to be exceeded but is a hard limit.

---

### INFO-017 — z-position sorting is stable
**File:** `src/character/composer.ts:119`
**Severity:** INFO
**Description:** `resolvedLayers.sort((a, b) => a.zPos - b.zPos)` uses numeric sort. JavaScript's `Array.sort` is stable in modern engines (V8, SpiderMonkey). Good practice.

---

## 7. Map Generation

### HIGH-024 — No input validation on map dimensions (all generators)
**File:** `src/map/dungeon.ts`, `src/map/cellular.ts`, `src/map/overworld.ts`, `src/map/town.ts`
**Severity:** HIGH
**Description:** None of the map generators validate `width` or `height`. Zero, negative, or NaN values would cause crashes (empty arrays, infinite loops, or NaN propagation).
**Impact:** Crash on invalid input with unhelpful error messages.
**Suggested fix:** Validate `width >= 10 && height >= 10 && Number.isFinite(width)` at entry.

---

### HIGH-025 — `floodFill` uses unbounded recursive stack
**File:** `src/map/cellular.ts` (floodFill function)
**Severity:** HIGH
**Description:** Flood fill implementation uses an explicit stack but with no size limit. On a 500×500 map, a single connected region could push 250,000 entries onto the stack array.
**Impact:** Excessive memory usage for large maps.
**Suggested fix:** Add a maximum region size limit or use iterative BFS with a queue.

---

### HIGH-026 — Room placement can exceed grid bounds in dungeon generator
**File:** `src/map/dungeon.ts:81-82`
**Severity:** HIGH
**Description:** Room offset calculation `rng.randomInt(1, node.w - rw - 1)` can produce negative or zero values when the room nearly fills the BSP node.
**Impact:** Room tiles written outside the grid array, causing crashes or memory corruption.
**Suggested fix:** Clamp room offsets to ensure the room fits within the node.

---

### MEDIUM-047 — Disconnected floors when stair POIs aren't placed
**File:** `src/map/multifloor.ts:78`
**Severity:** MEDIUM
**Description:** If the dungeon generator doesn't place "Stairs Down" POIs (e.g., only one room generated), `currentExit` is `undefined` and the floor connection is not created.
**Impact:** Multi-floor dungeon has unreachable floors with no warning.
**Suggested fix:** Log a warning or throw when floor connections cannot be established.

---

### MEDIUM-048 — WFC propagation has no visited set — potential infinite loop
**File:** `src/map/wfc.ts:220`
**Severity:** MEDIUM
**Description:** The propagation stack can re-add cells that were already processed if their neighbors reduce possibilities in a cycle. While the size-1 check provides some protection, a feedback loop between cells could cause excessive iterations.
**Impact:** Performance degradation or hang on certain tile configurations.
**Suggested fix:** Add a visited set or iteration counter with a bail-out.

---

### MEDIUM-049 — Town building count silently clamped to [4, 8]
**File:** `src/map/town.ts:25`
**Severity:** MEDIUM
**Description:** `Math.max(4, Math.min(8, buildings))` silently ignores user-specified counts outside this range. `buildings: 2` still creates 4.
**Impact:** User expectation violated without warning.
**Suggested fix:** Log a warning when clamping, or expand the allowed range.

---

### MEDIUM-050 — Town zone positions use magic offsets that break on small maps
**File:** `src/map/town.ts:94-101`
**Severity:** MEDIUM
**Description:** Zone positions use offsets like `sqX - 10`, `sqY - 10`. For maps smaller than ~30×30, zones have negative coordinates, collapse to the same clamped position, and most buildings fail overlap checks.
**Impact:** Small towns generate few or no buildings.
**Suggested fix:** Scale zone offsets relative to map dimensions.

---

### MEDIUM-051 — Market square `tiles[sqY + dy][sqX + dx]` lacks bounds check
**File:** `src/map/town.ts:72`
**Severity:** MEDIUM
**Description:** Market square tile placement has no bounds validation. If `sqSize` is too large relative to map size, writes exceed array bounds.
**Impact:** Array index out-of-bounds crash for edge-case configurations.
**Suggested fix:** Add bounds check: `if (sqY + dy < height && sqX + dx < width)`.

---

### MEDIUM-052 — Cellular cave generator places no POIs
**File:** `src/map/cellular.ts:114`
**Severity:** MEDIUM
**Description:** Unlike dungeon and overworld generators, the cave generator returns an empty `pois` array. No treasures, NPCs, or boss locations are placed.
**Impact:** Generated caves lack gameplay content compared to other map types.
**Suggested fix:** Add POI placement logic similar to dungeon generator.

---

### MEDIUM-053 — `temperature` config barely influences overworld biomes
**File:** `src/map/overworld.ts:106`
**Severity:** MEDIUM
**Description:** The `temperature` parameter affects only one biome condition (`m < 0.4 && temp > 0.3` for SAND). All other biome classifications ignore it.
**Impact:** Misleading config parameter that has minimal effect.
**Suggested fix:** Expand temperature influence to other biome classifications or document the limitation.

---

### MEDIUM-054 — All biome thresholds hardcoded in classifyBiome
**File:** `src/map/overworld.ts:98-108`
**Severity:** MEDIUM
**Description:** Eight threshold values (`0.25`, `0.3`, `0.8`, `0.35`, `0.7`, `0.55`, `0.4`, `0.3`) are hardcoded with no way to configure them.
**Impact:** Users cannot customize biome distribution.
**Suggested fix:** Accept optional threshold overrides in `OverworldConfig`.

---

### MEDIUM-055 — Village placement limited to 100 attempts
**File:** `src/map/overworld.ts:187`
**Severity:** MEDIUM
**Description:** `attempts = 100` limits village placement tries. On dense maps with strict distance constraints, this may not be enough to find valid positions.
**Impact:** Maps may have fewer villages than requested.
**Suggested fix:** Scale attempts based on map size.

---

### MEDIUM-056 — `connectRegions` uses random cell instead of closest pair
**File:** `src/map/cellular.ts:207`
**Severity:** MEDIUM
**Description:** Region connection picks `rng.pick(a)` (random cell from region A) to draw a tunnel to region B. This may create unnecessarily long corridors.
**Impact:** Suboptimal cave layout with long, thin corridors.
**Suggested fix:** Find closest cell pair between regions for more natural tunnels.

---

### LOW-041 — Max 4 villages hardcoded in overworld
**File:** `src/map/overworld.ts:189`
**Severity:** LOW
**Description:** Maximum village count capped at 4 regardless of map size.
**Impact:** Large maps have sparse village placement.
**Suggested fix:** Scale village count with map dimensions.

---

### LOW-042 — Treasure grid step of 10 hardcoded in overworld
**File:** `src/map/overworld.ts:74-75`
**Severity:** LOW
**Description:** Treasures are checked every 10 tiles via `for (let y = 2; y < height - 2; y += 10)`.
**Impact:** Treasure density not configurable; sparse on large maps.
**Suggested fix:** Make step size configurable or scale with map size.

---

### LOW-043 — `TownConfig` defined locally instead of in `types.ts`
**File:** `src/map/town.ts:5-9`
**Severity:** LOW
**Description:** `TownConfig` interface is defined in `town.ts` while all other map configs are in `types.ts`.
**Impact:** Inconsistent API; harder to discover configuration options.
**Suggested fix:** Move to `types.ts` with the other config interfaces.

---

### LOW-044 — `WFCConfig` defined locally instead of in `types.ts`
**File:** `src/map/wfc.ts:83`
**Severity:** LOW
**Description:** Same as above — `WFCConfig` is local instead of in `types.ts`.
**Impact:** Inconsistent API surface.
**Suggested fix:** Move to `types.ts`.

---

### LOW-045 — `BSPNode` interface defined inside function scope
**File:** `src/map/dungeon.ts:32-40`
**Severity:** LOW
**Description:** `BSPNode` interface is defined inside `generateDungeon` function body. While TypeScript allows this, it is unconventional and prevents reuse.
**Impact:** Cannot be imported for testing or composition.
**Suggested fix:** Move to module scope or `types.ts`.

---

### LOW-046 — Min BSP size uses magic number `+ 4`
**File:** `src/map/dungeon.ts:46`
**Severity:** LOW
**Description:** `const minSize = roomMinSize + 4` — the padding value `4` is unexplained.
**Impact:** Unclear why 4 was chosen; affects room generation.
**Suggested fix:** Add a comment explaining the padding purpose.

---

### LOW-047 — `VOID` tile (value 0) used for contradicted WFC cells
**File:** `src/map/wfc.ts:184`
**Severity:** LOW
**Description:** Collapsed WFC cells with zero possibilities are filled with `TT.VOID`. Downstream consumers may not expect VOID tiles.
**Impact:** Map rendering or collision detection may not handle VOID tiles correctly.
**Suggested fix:** Document VOID tile behavior or use WALL as default.

---

### LOW-048 — WFC `tileNames.indexOf` is O(n) per lookup
**File:** `src/map/wfc.ts:227`
**Severity:** LOW
**Description:** For each tile during propagation, `tileNames.indexOf(name)` performs linear search. With 6 default tiles this is fine, but custom tilesets would degrade.
**Impact:** Quadratic performance scaling for large custom tilesets.
**Suggested fix:** Pre-compute a `Map<string, number>` for O(1) lookup.

---

### LOW-049 — Floor count silently clamped in multifloor
**File:** `src/map/multifloor.ts:34`
**Severity:** LOW
**Description:** Floor count clamped to [2, 5] without warning. `floors: 1` generates 2; `floors: 10` generates 5.
**Impact:** User configuration silently overridden.
**Suggested fix:** Log a warning when clamping.

---

### INFO-018 — Dungeon generator uses BSP (Binary Space Partitioning)
**File:** `src/map/dungeon.ts`
**Severity:** INFO
**Description:** Good algorithm choice for guaranteed connectivity and reasonable room distribution.

---

### INFO-019 — WFC default tile weights tune generation distribution
**File:** `src/map/wfc.ts:14-81`
**Severity:** INFO
**Description:** Default weights (grass=4, tree=2, water=2, sand=1, path=1, stone=1) produce reasonable natural landscapes. Well-tuned.

---

### INFO-020 — POI type is a string union, not an enum
**File:** `src/map/types.ts:29`
**Severity:** INFO
**Description:** POI `type` field uses string union literal type. Enum would provide better refactoring support but string unions are valid TypeScript.

---

## 8. Godot Export & Systems

### HIGH-027 — Incorrect `load_steps` count in lighting `.tscn`
**File:** `src/lighting/index.ts:33-35`
**Severity:** HIGH
**Description:** `load_steps=${1 + extCount}` miscounts sub-resources. When point lights exist, 2 sub-resources (GradientTexture2D and Gradient) are created, requiring `load_steps=3`, not `2`.
**Impact:** Godot may fail to parse the generated scene file.
**Suggested fix:** Calculate `load_steps` based on actual sub-resource count.

---

### HIGH-028 — Sub-resource referenced before definition in lighting scene
**File:** `src/lighting/index.ts:43,45`
**Severity:** HIGH
**Description:** `SubResource("light_grad")` is used on line 43 but the `[sub_resource]` for `"light_grad"` appears on line 45. Godot's `.tscn` parser expects resources to be defined before use.
**Impact:** Godot scene load error or warning.
**Suggested fix:** Reorder sub-resource definitions to appear before first use.

---

### HIGH-029 — Scene transition fade-in ignores duration parameter
**File:** `src/systems/scene-transition.ts:43` (generated GDScript)
**Severity:** HIGH
**Description:** `_on_fade_out_done` uses hardcoded `0.5` second fade-in regardless of the `duration` parameter passed to `change_scene`.
**Impact:** API contract violated — duration parameter only controls fade-out.
**Suggested fix:** Pass and use the duration for both fade-out and fade-in.

---

### HIGH-030 — `get_tree().current_scene.add_child()` crashes during scene transitions
**File:** `src/systems/loot.ts:98` (generated GDScript)
**Severity:** HIGH
**Description:** If a loot drop occurs during a scene transition when `current_scene` is `null`, `add_child` throws a null reference error.
**Impact:** Game crash during scene transitions if loot is spawned.
**Suggested fix:** Guard: `if get_tree().current_scene: get_tree().current_scene.add_child(pickup)`.

---

### HIGH-031 — `await tree_changed` may resolve prematurely
**File:** `src/systems/save-load.ts:127` (generated GDScript)
**Severity:** HIGH
**Description:** `await get_tree().tree_changed` fires on any scene tree modification, not just when the target scene is loaded. The await could resolve on an unrelated tree change.
**Impact:** Save/load system attempts to restore state before the new scene is fully loaded.
**Suggested fix:** Use `await get_tree().create_timer(0.1).timeout` or connect to `scene_changed` signal.

---

### MEDIUM-057 — Viewport size hardcoded to 1280×720
**File:** `src/export/godot.ts:388-389`
**Severity:** MEDIUM
**Description:** Generated `project.godot` hardcodes viewport to 1280×720. Not configurable.
**Impact:** Users targeting different resolutions must manually edit the generated project.
**Suggested fix:** Add viewport dimensions to export options.

---

### MEDIUM-058 — Player position hardcoded to `Vector2(400, 400)`
**File:** `src/export/godot.ts:435`
**Severity:** MEDIUM
**Description:** Player initial position in scene is hardcoded. The spawn point from the map is not used for static placement.
**Impact:** Player always starts at (400, 400) regardless of map spawn point.
**Suggested fix:** Use `map.spawnPoint * tileSize` for initial position.

---

### MEDIUM-059 — `has_signal` check uses fragile string comparison
**File:** `src/systems/hud-full.ts:18` (generated GDScript)
**Severity:** MEDIUM
**Description:** `player.has_signal("health_changed")` uses a string that must exactly match the signal name. No compile-time check.
**Impact:** Silent failure if signal is renamed.
**Suggested fix:** Connect directly and catch the error, or use a constant for signal names.

---

### MEDIUM-060 — Inconsistent autoload access patterns in menu system
**File:** `src/systems/menu.ts:44-47` (generated GDScript)
**Severity:** MEDIUM
**Description:** `save_mgr` is set via `get_node_or_null("/root/SaveManager")` (null-safe), but then `SaveManager.MAX_SLOTS` is accessed directly (not null-safe).
**Impact:** Crash if SaveManager autoload is not registered.
**Suggested fix:** Use consistent null-checking for all autoload access.

---

### MEDIUM-061 — `SaveManager.current_slot` accessed without null check
**File:** `src/systems/menu.ts:162` (generated GDScript)
**Severity:** MEDIUM
**Description:** Pause menu references `SaveManager` directly without verifying the autoload exists.
**Impact:** Crash if SaveManager is not configured.
**Suggested fix:** Guard with `has_node("/root/SaveManager")`.

---

### MEDIUM-062 — Level 0 treated as falsy in save system
**File:** `src/systems/save-load.ts:112` (generated GDScript)
**Severity:** MEDIUM
**Description:** `player.get("level") if player.get("level") else 1` — if level is `0`, it evaluates to falsy and defaults to `1`.
**Impact:** Logic bug for any game using zero-based leveling.
**Suggested fix:** Use `player.get("level") if player.get("level") != null else 1`.

---

### MEDIUM-063 — `quest_id in completed_quests` is O(n) on Array
**File:** `src/systems/quest.ts:48` (generated GDScript)
**Severity:** MEDIUM
**Description:** `quest_id in completed_quests` performs linear search on Array. For games with many completed quests, this degrades.
**Impact:** Performance degradation proportional to quest count.
**Suggested fix:** Use `Dictionary` for `completed_quests` for O(1) lookup.

---

### MEDIUM-064 — `get_quest_info` returns mutable internal references
**File:** `src/systems/quest.ts:103-105` (generated GDScript)
**Severity:** MEDIUM
**Description:** `active_quests[quest_id]` returns a direct reference to the internal dictionary. External code can modify quest state without going through the API.
**Impact:** Quest state corruption when external code modifies the returned object.
**Suggested fix:** Return a duplicate: `return active_quests[quest_id].duplicate()`.

---

### MEDIUM-065 — Unused `delta` parameter in enemy AI physics process
**File:** `src/systems/enemy-ai.ts:55` (generated GDScript)
**Severity:** MEDIUM
**Description:** `_physics_process(delta: float)` accepts `delta` but never uses it. Movement should be delta-scaled for framerate independence.
**Impact:** Enemy movement speed varies with framerate.
**Suggested fix:** Multiply velocity by `delta` in movement calculations.

---

### MEDIUM-066 — `await` in state machine creates race condition
**File:** `src/systems/enemy-ai.ts:131` (generated GDScript)
**Severity:** MEDIUM
**Description:** `await get_tree().create_timer(0.4).timeout` suspends HURT state processing. If `_change_state` is called during the await, the state guard prevents crashes but the old coroutine continues.
**Impact:** Multiple coroutines can stack up, causing unexpected state transitions.
**Suggested fix:** Track the current coroutine and cancel previous ones on state change.

---

### MEDIUM-067 — `typed Array[Dictionary]` lost after load_data
**File:** `src/systems/inventory.ts:162` (generated GDScript)
**Severity:** MEDIUM
**Description:** `items = data.get("items", [])` replaces a typed `Array[Dictionary]` with a plain `Array`. Godot 4's strict typing may flag this.
**Impact:** Type safety lost after loading saved data.
**Suggested fix:** Cast: `items = data.get("items", []) as Array[Dictionary]`.

---

### MEDIUM-068 — Prop dimensions mismatch documentation
**File:** `src/ui/props.ts`
**Severity:** MEDIUM
**Description:** Torch entry says `width: 16` but generates a 32px-wide image (2 animation frames side-by-side). Campfire says `width: 32` but generates 64px wide.
**Impact:** Consumers relying on documented dimensions get wrong sizes.
**Suggested fix:** Update widths to match actual output or clarify that width is per-frame.

---

### MEDIUM-069 — `interact` input action used without verification
**File:** `src/systems/dialog.ts:148` (generated GDScript)
**Severity:** MEDIUM
**Description:** `is_action_pressed("interact")` will produce Godot warnings every frame if the action isn't configured in Project Settings.
**Impact:** Console spam and non-functional interaction.
**Suggested fix:** Add input actions to the generated `project.godot` or document required setup.

---

### MEDIUM-070 — JSON parse of dialog data has no type check
**File:** `src/systems/dialog.ts:232` (generated GDScript)
**Severity:** MEDIUM
**Description:** After `json.parse(file.get_as_text())`, `json.data` is assigned to `dialog_data: Array` without checking if the data is actually an Array. If the JSON contains a Dictionary, runtime error occurs.
**Impact:** Crash on malformed dialog JSON files.
**Suggested fix:** Add type check: `if json.data is Array`.

---

### LOW-050 — Enemy cannot chase beyond detection area
**File:** `src/systems/enemy-ai.ts:173-175` (generated GDScript)
**Severity:** LOW
**Description:** When player exits detection area, `target = null` immediately. Enemy transitions to IDLE even if player is just barely outside range.
**Impact:** Enemies give up chases immediately at detection boundary.
**Suggested fix:** Add a "leash" distance or chase timeout.

---

### LOW-051 — `file.close()` is redundant in Godot 4
**File:** `src/systems/save-load.ts:45` (generated GDScript)
**Severity:** LOW
**Description:** `FileAccess` auto-closes when going out of scope in Godot 4. Explicit `close()` is unnecessary.
**Impact:** No functional issue; dead code.
**Suggested fix:** Remove explicit `close()` calls.

---

### LOW-052 — Generated WASD keybindings assume QWERTY layout
**File:** `src/export/godot.ts:374-419`
**Severity:** LOW
**Description:** Input map uses ASCII keycodes 87(W), 65(A), 83(S), 68(D). Non-QWERTY layouts (AZERTY, Dvorak) will have wrong key mappings.
**Impact:** Controls unusable on non-QWERTY keyboards without reconfiguration.
**Suggested fix:** Use Godot physical key codes or document the limitation.

---

### LOW-053 — `randi() % total_weight` introduces modulo bias
**File:** `src/systems/loot.ts:47` (generated GDScript)
**Severity:** LOW
**Description:** `randi() % total_weight` has slight bias when `total_weight` doesn't evenly divide `2^32`.
**Impact:** Barely perceptible loot distribution skew. Acceptable for games.
**Suggested fix:** Use `randi_range(0, total_weight - 1)` or accept the bias for simplicity.

---

### LOW-054 — `save_mgr` variable unused after null check
**File:** `src/systems/menu.ts:44` (generated GDScript)
**Severity:** LOW
**Description:** `save_mgr = get_node_or_null("/root/SaveManager")` is assigned but all subsequent code uses `SaveManager` directly.
**Impact:** Misleading variable; the null check doesn't protect anything.
**Suggested fix:** Remove `save_mgr` variable or use it consistently.

---

### LOW-055 — Sprite offset `Vector2(0, -16)` not derived from frame size
**File:** `src/export/godot.ts:144`
**Severity:** LOW
**Description:** Sprite offset hardcoded rather than computed from `FRAME_SIZE`.
**Impact:** Wrong visual alignment if frame size changes.
**Suggested fix:** Compute as `Vector2(0, -FRAME_SIZE / 4)`.

---

### LOW-056 — Collision layer/mask values hardcoded as raw integers
**File:** `src/export/godot.ts:155-156,168-169`
**Severity:** LOW
**Description:** `collision_layer = 2`, `collision_mask = 0` used without constants or documentation.
**Impact:** Hard to understand what layers are assigned without referring to Godot's bit system.
**Suggested fix:** Add comments documenting which layer is which.

---

### LOW-057 — Timer wait times hardcoded in player scene
**File:** `src/export/godot.ts:179,183`
**Severity:** LOW
**Description:** `wait_time = 0.4` (hit cooldown) and `wait_time = 0.5` (attack duration) are hardcoded.
**Impact:** Not configurable through export API.
**Suggested fix:** Add to export options.

---

### LOW-058 — `color_ramp = null` in torch fire particle
**File:** `src/lighting/particles.ts:90`
**Severity:** LOW
**Description:** Setting `color_ramp = null` in `.tscn` format may not be valid Godot syntax.
**Impact:** Godot may warn or ignore this property.
**Suggested fix:** Omit the property instead of setting to null.

---

### LOW-059 — `textureScale` set for directional lights (not applicable)
**File:** `src/lighting/presets.ts:62-63`
**Severity:** LOW
**Description:** `textureScale` is defined for directional light presets (e.g., `overworld_sunset`) but `DirectionalLight2D` doesn't use a texture scale.
**Impact:** Data inconsistency; no runtime impact since the exporter doesn't emit it for directional lights.
**Suggested fix:** Remove `textureScale` from directional light presets.

---

### LOW-060 — Character name and map name not sanitized in resource paths
**File:** `src/export/godot.ts` (multiple locations)
**Severity:** LOW
**Description:** `characterName` and `mapName` are interpolated into Godot resource paths (`res://...`) without sanitizing special characters.
**Impact:** Godot resource paths with spaces or special chars may not resolve.
**Suggested fix:** Sanitize to lowercase alphanumeric with underscores.

---

### LOW-061 — Generated scripts use `\t` literal in template strings
**File:** `src/export/godot.ts` (throughout)
**Severity:** LOW
**Description:** GDScript is generated using template literals with `\t` escape characters. This makes the templates hard to read and maintain in the TypeScript source.
**Impact:** Maintenance burden; error-prone when editing generated code.
**Suggested fix:** Consider using a template file or indentation utility.

---

### LOW-062 — No missing dependency warning for SFX generator
**File:** `src/audio/sfx-generator.ts:24`
**Severity:** LOW
**Description:** `require('jsfxr')` inside function body has no try/catch. If the package is missing, users get an unhelpful `MODULE_NOT_FOUND` error.
**Impact:** Poor error message for optional dependency.
**Suggested fix:** Wrap in try/catch with a helpful error message.

---

### LOW-063 — Generated player script health_changed signal emission formatting
**File:** `src/export/godot.ts:487`
**Severity:** LOW
**Description:** `health_changed.emit(health, MAX_HEALTH)\t# Move to spawn point` — comment is jammed onto the same line with a tab.
**Impact:** Poor code formatting in generated GDScript.
**Suggested fix:** Place comment on separate line.

---

### LOW-064 — `replaceAll(/\s+/g, '_')` in SFX generator
**File:** `src/audio/sfx-generator.ts:49`
**Severity:** LOW
**Description:** Using regex with `replaceAll` works in modern Node.js but `replace` with global flag is more conventional.
**Impact:** No functional issue; slightly unconventional pattern.
**Suggested fix:** Use `.replace(/\s+/g, '_')`.

---

### LOW-065 — Test file for license placed inside `lighting.test.ts`
**File:** `src/__tests__/lighting.test.ts:77-84`
**Severity:** LOW
**Description:** License validation tests are in the lighting test file instead of `license.test.ts`.
**Impact:** Hard to find; unexpected test location.
**Suggested fix:** Move to `license.test.ts`.

---

### LOW-066 — License tests may use cached module instances
**File:** `src/__tests__/license.test.ts:60,75,83,102`
**Severity:** LOW
**Description:** Dynamic `import()` re-imports return the same cached module. Tests expecting fresh state may be testing stale module instances.
**Impact:** Tests may pass or fail for wrong reasons; not truly isolated.
**Suggested fix:** Use `vi.resetModules()` before each dynamic import.

---

### LOW-067 — No tests for asset manager module
**File:** `src/__tests__/`
**Severity:** LOW
**Description:** No test file exists for `src/assets/manager.ts`, which is a critical module handling downloads, checksums, and file extraction.
**Impact:** Regressions in asset pipeline go undetected by CI.
**Suggested fix:** Add integration tests with mocked HTTP responses.

---

### INFO-021 — Generated quest system has clean architecture
**File:** `src/systems/quest.ts`
**Severity:** INFO
**Description:** Quest system uses signals, state tracking, and prerequisite checking. Well-structured despite the issues noted.

---

### INFO-022 — Day-night system interpolates colors smoothly
**File:** `src/systems/day-night.ts`
**Severity:** INFO
**Description:** The lerp-based color interpolation between time-of-day keyframes produces smooth transitions. Good implementation.

---

### INFO-023 — Inventory system supports stacking, max capacity, and persistence
**File:** `src/systems/inventory.ts`
**Severity:** INFO
**Description:** Full inventory system with stackable/non-stackable items, capacity limits, equipped items, and save/load. Comprehensive for generated code.

---

### INFO-024 — Enemy AI uses finite state machine pattern
**File:** `src/systems/enemy-ai.ts`
**Severity:** INFO
**Description:** IDLE → CHASE → ATTACK → HURT → DIE state machine is well-structured and extensible.

---

### INFO-025 — Scene transition uses ColorRect fade (lightweight)
**File:** `src/systems/scene-transition.ts`
**Severity:** INFO
**Description:** Fade implemented with a simple ColorRect + Tween rather than a shader. Good choice for a generated starter project.

---

### INFO-026 — `project.godot` includes `id-token: write` for npm provenance
**File:** `.github/workflows/npm-publish.yml`
**Severity:** INFO
**Description:** npm publish uses `--provenance` flag for supply chain security. Good practice.

---

### INFO-027 — No tests for UI generator pixel output
**File:** `src/__tests__/`
**Severity:** INFO
**Description:** Tests verify that UI functions return PNGs with data, but don't validate pixel correctness. The `hexToRGBA` alpha bug (HIGH-007) would not be caught.

---

### INFO-028 — No tests for credits CSV parser
**File:** `src/__tests__/`
**Severity:** INFO
**Description:** Credits parsing logic has no test coverage. The bidirectional `includes` matching (LOW-011) goes untested.

---
