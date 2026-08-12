import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const parseArgs = (values) => {
  const args = new Map();
  for (let index = 2; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, true);
    } else {
      args.set(key, next);
      index += 1;
    }
  }
  return args;
};

const parseEnv = async (file) => {
  const raw = await readFile(file, "utf8");
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator);
        const rawValue = line.slice(separator + 1);
        try {
          return [key, JSON.parse(rawValue)];
        } catch {
          return [key, rawValue];
        }
      }),
  );
};

const classify = (id) => {
  if (id.includes("idle")) return "idle";
  if (id.includes("welcome")) return "welcome";
  if (id.includes("farewell")) return "farewell";
  if (id.includes("look_")) return "look";
  if (id.includes("taking_order")) return "taking_order";
  if (id.includes("live_invite")) return "live_invite";
  return "action";
};

const contentTypeByExtension = {
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};

const args = parseArgs(process.argv);
const required = ["--input", "--tenant", "--product", "--avatar", "--version"];
for (const key of required) {
  if (!args.get(key)) throw new Error(`Missing ${key}`);
}

const input = path.resolve(String(args.get("--input")));
const tenant = String(args.get("--tenant"));
const product = String(args.get("--product"));
const avatarId = String(args.get("--avatar"));
const version = String(args.get("--version"));
const bucket = String(args.get("--bucket") ?? "avatar-cache");
const upsert = Boolean(args.get("--upsert"));
const prefix = [tenant, product, avatarId, version].join("/");
const env = await parseEnv(path.resolve(String(args.get("--env") ?? ".env.local")));

if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const storage = supabase.storage.from(bucket);
const entries = (await readdir(input, { withFileTypes: true }))
  .filter(
    (entry) =>
      entry.isFile() &&
      !entry.name.toLowerCase().includes("backup") &&
      Object.hasOwn(contentTypeByExtension, path.extname(entry.name).toLowerCase()),
  )
  .sort((left, right) => left.name.localeCompare(right.name));

if (entries.length === 0) throw new Error(`No avatar videos found in ${input}`);

const assets = await Promise.all(
  entries.map(async (entry) => {
    const absolute = path.join(input, entry.name);
    const bytes = await readFile(absolute);
    const id = path.basename(entry.name, path.extname(entry.name));
    const kind = classify(id);
    return {
      id,
      fileName: entry.name,
      absolute,
      bytes,
      manifest: {
        id,
        url: entry.name,
        kind,
        priority:
          id.includes("welcome") || id.endsWith("idle_cut_1") || id.includes("look_")
            ? "critical"
            : "lazy",
        muted: kind === "idle" || kind === "look",
        bytes: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    };
  }),
);

const idleAssets = assets.filter((asset) => asset.manifest.kind === "idle");
if (idleAssets.length === 0) throw new Error("The cache requires at least one idle clip");
const defaultIdle =
  idleAssets.find((asset) => asset.id.endsWith("idle_cut_1")) ?? idleAssets[0];
const longWaitIdle = idleAssets.find((asset) => asset.id.includes("idle_cut_wait"));
const publicBaseUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${prefix}`;

const uploaded = [];
for (const asset of assets) {
  const remotePath = `${prefix}/${asset.fileName}`;
  const { error } = await storage.upload(remotePath, asset.bytes, {
    contentType: contentTypeByExtension[path.extname(asset.fileName).toLowerCase()],
    cacheControl: "31536000",
    upsert,
  });
  if (error) throw new Error(`Upload failed for ${asset.fileName}: ${error.message}`);
  uploaded.push(remotePath);
  console.log(`Uploaded ${uploaded.length}/${assets.length}: ${asset.fileName}`);
}

const manifest = {
  schemaVersion: 1,
  avatarId,
  version,
  baseUrl: publicBaseUrl,
  defaultIdleId: defaultIdle.id,
  ...(longWaitIdle ? { longWaitIdleId: longWaitIdle.id } : {}),
  assets: assets.map((asset) => asset.manifest),
};
const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const manifestPath = `${prefix}/cache-manifest.json`;
const { error: manifestError } = await storage.upload(manifestPath, manifestBytes, {
  contentType: "application/json",
  cacheControl: "31536000",
  upsert,
});
if (manifestError) {
  throw new Error(`Manifest upload failed: ${manifestError.message}`);
}

const generatedDirectory = path.resolve("generated");
await mkdir(generatedDirectory, { recursive: true });
const localManifestPath = path.join(
  generatedDirectory,
  `${tenant}-${product}-${avatarId}-${version}.manifest.json`,
);
await writeFile(localManifestPath, manifestBytes);

console.log(
  JSON.stringify({
    bucket,
    prefix,
    assets: assets.length,
    bytes: assets.reduce((sum, asset) => sum + asset.bytes.byteLength, 0),
    manifest: `${publicBaseUrl}/cache-manifest.json`,
    immutable: !upsert,
  }),
);
