#!/usr/bin/env node
// The CLI for this marketplace. Run it with no arguments for usage.
//
// Descriptions are set by hand in .claude-plugin/marketplace.json and copied
// everywhere else.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = import.meta.dirname;
const MARKETPLACE = join(root, ".claude-plugin/marketplace.json");
const CODEX_MARKETPLACE = join(root, ".agents/plugins/marketplace.json");

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const writeJson = (path: string, value: unknown) =>
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function field(record: Record<string, unknown>, key: string, where: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${where}: "${key}" must be a string`);
  return value;
}

// A string source is a local plugin path; an object source is someone else's
// repo and has no manifest here to update.
function localPlugins(input: unknown): { name: string; path: string; description: string }[] {
  if (!isRecord(input) || !Array.isArray(input.plugins)) {
    throw new Error(`${MARKETPLACE}: "plugins" must be an array`);
  }
  return input.plugins.flatMap((entry: unknown) =>
    isRecord(entry) && typeof entry.source === "string"
      ? [
          {
            name: field(entry, "name", `${MARKETPLACE}: ${entry.source}`),
            path: entry.source,
            description: field(entry, "description", `${MARKETPLACE}: ${entry.source}`),
          },
        ]
      : [],
  );
}

// Set the key, reporting whether anything actually changed.
function set(record: Record<string, unknown>, key: string, value: string): boolean {
  if (record[key] === value) return false;
  record[key] = value;
  return true;
}

// Sync every manifest to package.json and marketplace.json, returning the
// files that were out of date. With write false, only report them.
function sync(write: boolean): { version: string; changed: string[] } {
  const pkg = readJson(join(root, "package.json"));
  if (!isRecord(pkg)) throw new Error("package.json: must be an object");
  const version = field(pkg, "version", "package.json");
  const changed: string[] = [];

  const plugins = localPlugins(readJson(MARKETPLACE));
  const codex = readJson(CODEX_MARKETPLACE);
  if (!isRecord(codex) || !Array.isArray(codex.plugins)) {
    throw new Error(`${CODEX_MARKETPLACE}: "plugins" must be an array`);
  }

  for (const { path, description } of plugins) {
    for (const manifest of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
      const manifestPath = join(root, path, manifest);
      if (!existsSync(manifestPath)) throw new Error(`${path}/${manifest}: missing`);
      const json = readJson(manifestPath);
      if (!isRecord(json)) throw new Error(`${manifestPath}: must be an object`);
      let dirty = set(json, "version", version);
      if (set(json, "description", description)) dirty = true;
      if (dirty) {
        if (write) writeJson(manifestPath, json);
        changed.push(`${path}/${manifest}`);
      }
    }
  }

  let codexDirty = false;
  for (const entry of codex.plugins) {
    const description = isRecord(entry) && plugins.find((plugin) => plugin.name === entry.name)?.description;
    if (description && set(entry, "description", description)) codexDirty = true;
  }
  if (codexDirty) {
    if (write) writeJson(CODEX_MARKETPLACE, codex);
    changed.push(".agents/plugins/marketplace.json");
  }

  return { version, changed };
}

const list = (files: string[]) => files.map((file) => `  ${file}`).join("\n");

function version(): void {
  const { version, changed } = sync(true);
  console.log(`skills ${version}`);
  console.log(changed.length === 0 ? "Manifests already current." : "Synced:\n" + list(changed));
}

// Release gate, run by CI on every change so a broken release fails the PR
// instead of the release.
function check(): void {
  const { version, changed } = sync(false);
  if (changed.length > 0) {
    throw new Error(`Out of date, run npm run version:\n${list(changed)}`);
  }
  console.log(`skills ${version}: manifests current`);
}

const USAGE = `usage: cli <command>

  version      Propagate version and description into every plugin manifest
  check        Fail if any manifest is out of date`;

const [command] = process.argv.slice(2);
if (command === "version") version();
else if (command === "check") check();
else {
  console.error(USAGE);
  process.exit(1);
}
