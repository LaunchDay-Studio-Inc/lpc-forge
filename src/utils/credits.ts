import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface CreditEntry {
  file: string;
  authors: string[];
  licenses: string[];
  urls: string[];
  notes?: string;
}

/** Parse CREDITS.csv and return structured credit entries */
export async function parseCredits(repoRoot: string): Promise<CreditEntry[]> {
  const csvPath = join(repoRoot, 'CREDITS.csv');
  const content = await readFile(csvPath, 'utf-8');
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const entries: CreditEntry[] = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;

    entries.push({
      file: cols[0],
      authors: cols[1] ? cols[1].split(',').map((a) => a.trim()) : [],
      licenses: cols[2] ? cols[2].split(',').map((l) => l.trim()) : [],
      urls: cols[3] ? cols[3].split(',').map((u) => u.trim()) : [],
      notes: cols[4] || undefined,
    });
  }
  return entries;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Generate a credits text file for used layers */
export function generateCreditsText(credits: CreditEntry[], usedPaths: string[]): string {
  const relevant = credits.filter((c) =>
    usedPaths.some((p) => p === c.file || p.endsWith('/' + c.file) || c.file.endsWith('/' + p)),
  );

  if (relevant.length === 0) {
    return 'Credits: Based on Liberated Pixel Cup (LPC) assets. See CREDITS.csv for full attribution.\n';
  }

  const lines = ['=== Asset Credits ===', ''];
  for (const entry of relevant) {
    lines.push(`File: ${entry.file}`);
    lines.push(`Authors: ${entry.authors.join(', ')}`);
    lines.push(`Licenses: ${entry.licenses.join(', ')}`);
    if (entry.urls.length > 0) {
      lines.push(`URLs: ${entry.urls.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('Full credits available in CREDITS.csv');
  return lines.join('\n');
}
