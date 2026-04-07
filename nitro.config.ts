import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  runtimeConfig: {
    forgejoBaseUrl: "http://10.0.1.5:3000",
    preferredRunnerUuids: "",
    fallbackRunnerUuids: "",
    preferredRunnerTtlSeconds: 15,
    blockUnassignedRunners: false,
    trustXForwardedFor: true,
    logLevel: "info",
  },
});
