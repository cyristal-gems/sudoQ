import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

rmSync(resolve(repoRoot, "assets"), { recursive: true, force: true });
cpSync(resolve(repoRoot, "dist", "assets"), resolve(repoRoot, "assets"), { recursive: true });
cpSync(resolve(repoRoot, "dist", "index.html"), resolve(repoRoot, "index.html"));
cpSync(resolve(repoRoot, "dist", "icon.png"), resolve(repoRoot, "icon.png"));

console.log("Synced dist output to the repo root for GitHub Pages.");
