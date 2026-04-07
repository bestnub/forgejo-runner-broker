import { defineHandler } from "nitro";
import { getAppConfig } from "../../utils/config";
import {
  fingerprintRunnerIdentity,
  getClientIp,
  getRunnerIdentityHeaders,
} from "../../utils/identity";
import {
  markRunnerBlocked,
  markRunnerFetch,
  markRunnerSeen,
  upsertRunner,
} from "../../utils/state";
import {
  FETCH_TASK_PATH,
  blockFetch,
  proxyUpstream,
  shouldBlockFetch,
} from "../../utils/proxy";

export default defineHandler(async (event) => {
  const suffix = event.context.params?.path ?? "";
  const path = `/api/actions/${suffix}`;

  const config = getAppConfig();
  const { uuid, token } = getRunnerIdentityHeaders(event);

  const runner = upsertRunner({
    uuid,
    tokenFingerprint: await fingerprintRunnerIdentity(uuid, token),
    userAgent: event.req.headers.get("user-agent"),
    remoteIp: getClientIp(event, config.trustXForwardedFor),
    config,
  });

  if (path === FETCH_TASK_PATH) {
    const decision = shouldBlockFetch(runner, config);

    if (decision.blocked) {
      markRunnerBlocked(runner.uuid);
      return blockFetch(event);
    }
  }

  const response = await proxyUpstream(event, config, path);

  if (path === FETCH_TASK_PATH) {
    markRunnerFetch(runner.uuid);
  } else {
    markRunnerSeen(runner.uuid);
  }

  return response;
});
