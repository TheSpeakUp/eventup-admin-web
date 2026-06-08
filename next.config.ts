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
};

export default nextConfig;
