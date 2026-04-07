import type { H3Event } from "nitro";
import { HTTPError } from "nitro";
import type { AppConfig, RunnerState } from "./types";
import { preferredRunnerAvailable } from "./state";

export const FETCH_TASK_PATH = "/api/actions/runner.v1.RunnerService/FetchTask";

export function joinForgejoUrl(baseUrl: string, path: string) {
  return new URL(path.replace(/^\//, ""), `${baseUrl}/`).toString();
}

export function shouldBlockFetch(runner: RunnerState, config: AppConfig) {
  if (runner.role === "preferred") {
    return { blocked: false, reason: null as string | null };
  }

  if (runner.role === "fallback") {
    if (preferredRunnerAvailable(config)) {
      return { blocked: true, reason: "preferred-runner-available" };
    }

    return { blocked: false, reason: null as string | null };
  }

  if (config.blockUnassignedRunners) {
    return { blocked: true, reason: "unassigned-runner-blocked" };
  }

  return { blocked: false, reason: null as string | null };
}

export async function proxyUpstream(
  event: H3Event,
  config: AppConfig,
  path: string,
) {
  if (!config.forgejoBaseUrl) {
    throw new HTTPError({
      status: 500,
      message: "Forgejo base URL is not configured",
    });
  }

  const incomingHeaders = event.req.headers;
  const headers = new Headers();

  incomingHeaders.forEach((value, key) => {
    if (
      [
        "host",
        "connection",
        "content-length",
        "x-forwarded-host",
        "accept-encoding",
      ].includes(key.toLowerCase())
    ) {
      return;
    }

    headers.set(key, value);
  });

  const body =
    event.req.method === "GET" || event.req.method === "HEAD"
      ? undefined
      : await event.req.arrayBuffer();

  const response = await fetch(joinForgejoUrl(config.forgejoBaseUrl, path), {
    method: event.req.method,
    headers,
    body,
  });

  event.res.status = response.status;

  response.headers.forEach((value, key) => {
    if (
      [
        "content-length",
        "transfer-encoding",
        "connection",
        "content-encoding",
      ].includes(key.toLowerCase())
    ) {
      return;
    }

    event.res.headers.set(key, value);
  });

  return await response.arrayBuffer();
}

export function blockFetch(event: H3Event) {
  event.res.status = 200;
  event.res.headers.set("content-type", "application/proto");
  return new Uint8Array(0);
}
