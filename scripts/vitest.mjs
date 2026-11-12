// Starts Vitest from a working directory with an upper-case drive letter.
//
// On Windows a terminal opened at "c:\..." (VS Code does this) makes Vitest load its own
// modules under two spellings of the same path; every suite then fails with
// "Cannot read properties of undefined (reading 'config')". Elsewhere this is a no-op.
import { spawnSync } from "node:child_process";
import path from "node:path";

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const vitest = path.join(cwd, "node_modules", "vitest", "vitest.mjs");
const result = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
