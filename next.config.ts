import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os SKILL.md são lidos em runtime pelo registry; garante que entrem no bundle serverless.
  outputFileTracingIncludes: {
    "/api/chat": ["./src/agent/skills/**/SKILL.md"],
  },
};

export default nextConfig;
