import { readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve(process.argv[2] ?? "examples/avatar-manifest.example.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.schemaVersion !== 1) throw new Error("Unsupported schemaVersion");
if (!manifest.avatarId || !manifest.version || !manifest.baseUrl) {
  throw new Error("Manifest requires avatarId, version and baseUrl");
}
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  throw new Error("Manifest has no assets");
}

const ids = new Set();
for (const asset of manifest.assets) {
  if (!asset.id || !asset.url || !asset.kind) {
    throw new Error("Every asset requires id, url and kind");
  }
  if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
  ids.add(asset.id);
}

const defaultIdle = manifest.assets.find((asset) => asset.id === manifest.defaultIdleId);
if (!defaultIdle || defaultIdle.kind !== "idle") {
  throw new Error("defaultIdleId must reference an idle asset");
}
if (manifest.longWaitIdleId) {
  const longWait = manifest.assets.find((asset) => asset.id === manifest.longWaitIdleId);
  if (!longWait || longWait.kind !== "idle") {
    throw new Error("longWaitIdleId must reference an idle asset");
  }
}

console.log(`Avatar manifest valid: ${manifest.avatarId}@${manifest.version}, ${ids.size} assets`);
