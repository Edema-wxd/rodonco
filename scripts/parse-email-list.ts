// scripts/parse-email-list.ts
// Cleans a raw text list of email addresses into a validated, deduped CSV.
//
//   npx tsx scripts/parse-email-list.ts <input.txt> [output.csv]
//
// Accepts almost any shape: one-per-line, comma/semicolon/tab separated,
// "Name <addr@example.com>", or addresses buried in surrounding prose.
// Sends nothing and touches no database — parse and inspect only.

import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "scripts/out/email-list-clean.csv";

if (!inputPath) {
  console.error("Usage: npx tsx scripts/parse-email-list.ts <input.txt> [output.csv]");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");

// Pull "Name <addr>" pairs first so we can keep the display name when present.
const NAMED = /([^<>,;\n\t]+?)\s*<\s*([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)\s*>/g;
// Then any bare address anywhere in the text.
const BARE = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Addresses that are usually distribution lists or unmonitored, not people.
const ROLE_PREFIXES = [
  "admin", "info", "support", "sales", "contact", "hello", "noreply",
  "no-reply", "donotreply", "postmaster", "webmaster", "abuse", "billing",
  "help", "team", "office", "enquiries", "inquiries",
];

// Common typo domains worth a human glance before sending.
const SUSPECT_DOMAINS: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.con": "gmail.com",
  "yahoo.co": "yahoo.com",
  "yaho.com": "yahoo.com",
  "hotmail.co": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlook.co": "outlook.com",
  "icloud.co": "icloud.com",
};

interface Entry {
  email: string;
  name: string;
}

const names = new Map<string, string>();
let match: RegExpExecArray | null;

while ((match = NAMED.exec(raw)) !== null) {
  const name = match[1].trim().replace(/^["']|["']$/g, "");
  const email = match[2].trim().toLowerCase();
  // Ignore a "name" that is itself just an address fragment.
  if (name && !name.includes("@")) names.set(email, name);
}

const found = raw.match(BARE) ?? [];

const seen = new Set<string>();
const entries: Entry[] = [];
const duplicates: string[] = [];
const roleAccounts: Entry[] = [];
const suspects: { entry: Entry; suggestion: string }[] = [];

for (const candidate of found) {
  // Strip trailing punctuation that regex can pick up from prose.
  const email = candidate.toLowerCase().replace(/[.,;:]+$/, "");

  if (seen.has(email)) {
    duplicates.push(email);
    continue;
  }
  seen.add(email);

  const entry: Entry = { email, name: names.get(email) ?? "" };

  const [local, domain] = email.split("@");

  if (ROLE_PREFIXES.includes(local)) roleAccounts.push(entry);
  if (SUSPECT_DOMAINS[domain]) {
    suspects.push({ entry, suggestion: `${local}@${SUSPECT_DOMAINS[domain]}` });
  }

  entries.push(entry);
}

// ─── Report ──────────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const outDir = path.dirname(outputPath);
fs.mkdirSync(outDir, { recursive: true });

const csv = ["email,name", ...entries.map((e) => `${csvCell(e.email)},${csvCell(e.name)}`)].join("\n");
fs.writeFileSync(outputPath, csv + "\n", "utf8");

const domainCounts = new Map<string, number>();
for (const { email } of entries) {
  const domain = email.split("@")[1];
  domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
}
const topDomains = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

console.log(`\nParsed ${inputPath}`);
console.log(`${"─".repeat(52)}`);
console.log(`Raw matches found : ${found.length}`);
console.log(`Unique addresses  : ${entries.length}`);
console.log(`Duplicates removed: ${duplicates.length}`);
console.log(`With display name : ${entries.filter((e) => e.name).length}`);

console.log(`\nTop domains:`);
for (const [domain, count] of topDomains) {
  console.log(`  ${String(count).padStart(4)}  ${domain}`);
}

if (roleAccounts.length) {
  console.log(`\n⚠  ${roleAccounts.length} role/distribution account(s) — usually unmonitored:`);
  for (const e of roleAccounts) console.log(`     ${e.email}`);
}

if (suspects.length) {
  console.log(`\n⚠  ${suspects.length} likely typo domain(s) — verify before sending:`);
  for (const s of suspects) console.log(`     ${s.entry.email}  →  did you mean ${s.suggestion}?`);
}

if (duplicates.length) {
  const unique = [...new Set(duplicates)];
  console.log(`\n   Duplicate entries (kept once): ${unique.slice(0, 10).join(", ")}${unique.length > 10 ? ` …+${unique.length - 10} more` : ""}`);
}

console.log(`\n✅ Clean list written to ${outputPath}`);
console.log(`   Review it, then import to a Resend segment.\n`);
