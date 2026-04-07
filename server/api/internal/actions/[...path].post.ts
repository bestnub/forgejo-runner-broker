import { defineHandler } from "nitro";
import { getAppConfig } from "../../../utils/config";
import {
  fingerprintRunnerIdentity,
  getClientIp,
  getRunnerIdentityHeaders,
} from "../../../utils/identity";
import { markRunnerSeen, upsertRunner } from "../../../utils/state";
import { proxyUpstream } from "../../../utils/proxy";

export default defineHandler(async (event) => {
  const suffix = event.context.params?.path ?? "";
  const path = `/api/internal/actions/${suffix}`;

  const config = getAppConfig();
  const { uuid, token } = getRunnerIdentityHeaders(event);

  const runner = upsertRunner({
    uuid,
    tokenFingerprint: await fingerprintRunnerIdentity(uuid, token),
    userAgent: event.req.headers.get("user-agent"),
    remoteIp: getClientIp(event, config.trustXForwardedFor),
    config,
  });

  const response = await proxyUpstream(event, config, path);
  markRunnerSeen(runner.uuid);
  return response;
});
