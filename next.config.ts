import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shaders WGSL do vgpu importados como módulos tipados (src/wgsl-env.d.ts).
  turbopack: {
    rules: {
      "*.wgsl": { loaders: ["@vgpu/wgsl/loader-webpack"], as: "*.js" },
    },
  },
  webpack(config) {
    config.module.rules.push({ test: /\.wgsl$/, loader: "@vgpu/wgsl/loader-webpack" });
    return config;
  },
  // Os SKILL.md são lidos em runtime pelo registry; garante que entrem no bundle serverless.
  outputFileTracingIncludes: {
    "/api/chat": ["./src/agent/skills/**/SKILL.md"],
  },
};

export default nextConfig;
