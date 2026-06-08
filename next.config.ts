import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle at `.next/standalone/server.js`.
  // The deploy pipeline rsyncs that dir to the prod box; systemd runs
  // `node /opt/eventup-admin-web/server.js`. No `next start` needed.
  output: "standalone",

  // Pin Next's workspace-root inference to this repo so it stops walking up
  // looking for a pnpm-workspace marker — relevant for git-worktree checkouts
  // and the GHA build runner.
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),

  // pnpm puts deps under node_modules/.pnpm/... + symlinks. Next's file
  // tracer occasionally drops things at the edge of those symlink chains.
  // Force-include the swc helpers (required by next/dist/shared/lib/constants.js
  // — missing this is what produced MODULE_NOT_FOUND on the first prod boot).
  outputFileTracingIncludes: {
    "/": [
      "./node_modules/@swc/helpers/**/*",
      "./node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*",
    ],
  },
};

export default nextConfig;
