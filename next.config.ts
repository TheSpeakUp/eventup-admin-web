import type { NextConfig } from "next";

// Pin filesystem tracing to the project directory. Without this, Next walks
// up looking for the nearest lockfile/workspace marker and may pick a parent
// (e.g. a git worktree checkout sitting inside the main checkout), which
// nests standalone/server.js deep under the resolved root path.
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
