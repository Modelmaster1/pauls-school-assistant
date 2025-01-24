/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
// @ts-ignore
import autoCert from "anchor-pki/auto-cert/integrations/next";

// next.config.mjs

const withAutoCert = autoCert({
  enabledEnv: "development",
});

/** @type {import("next").NextConfig} */
const config = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default withAutoCert(config);
