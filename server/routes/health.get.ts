import { defineHandler } from "nitro";

export default defineHandler(() => {
  return {
    ok: true,
    service: "forgejo-runner-broker",
    timestamp: new Date().toISOString(),
  };
});
