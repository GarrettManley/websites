import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

/** Builds dist so the integration test exercises the real emitted package. */
export default function setup(): void {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.build.json"], { stdio: "inherit" });
}
