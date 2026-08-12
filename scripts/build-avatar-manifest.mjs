import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const requiredArgs = ["--input", "--base-url", "--avatar", "--version", "--output"];
for (const key of requiredArgs) {
  if (!args.get(key)) {
    throw new Error(`Missing ${key}. See README.md for an example.`);
  }
}

const input = path.resolve(args.get("--input"));
const output = path.resolve(args.get("--output"));
const baseUrl = args.get("--base-url").replace(/\/$/, "");

const classify = (id) => {
  if (id.includes("idle")) return "idle";
  if (id.includes("welcome")) return "welcome";
  if (id.includes("farewell")) return "farewell";
  if (id.includes("look_")) return "look";
  if (id.includes("taking_order")) return "taking_order";
  if (id.includes("live_invite")) return "live_invite";
  return "action";
};

const entries = await readdir(input, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && /\.(webm|mp4)$/i.test(entry.name))
  .map((entry) => path.join(input, entry.name))
  .sort((left, right) => left.localeCompare(right));

if (files.length === 0) {
  throw new Error(`No avatar videos found in ${input}`);
}

const assets = await Promise.all(
  files.map(async (file) => {
    const fileName = path.basename(file);
    const id = path.basename(file, path.extname(file));
    const bytes = await readFile(file);
    const fileStat = await stat(file);
    const kind = classify(id);
    return {
      id,
      url: fileName,
      kind,
      priority: id.includes("welcome") || id.endsWith("idle_cut_1") ? "critical" : "lazy",
      muted: kind === "idle" || kind === "look",
      bytes: fileStat.size,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }),
);

const idleAssets = assets.filter((asset) => asset.kind === "idle");
if (idleAssets.length === 0) {
  throw new Error("At least one filename must contain 'idle'");
}

const defaultIdle = idleAssets.find((asset) => asset.id.endsWith("idle_cut_1")) ?? idleAssets[0];
const longWaitIdle = idleAssets.find((asset) => asset.id.includes("idle_cut_wait"));
const manifest = {
  schemaVersion: 1,
  avatarId: args.get("--avatar"),
  version: args.get("--version"),
  baseUrl,
  defaultIdleId: defaultIdle.id,
  ...(longWaitIdle ? { longWaitIdleId: longWaitIdle.id } : {}),
  assets,
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Avatar manifest: ${assets.length} assets -> ${output}`);
