import type { H3Event } from "nitro";
import { HTTPError } from "nitro";
import { getRequestIP } from "nitro/h3";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function fingerprintRunnerIdentity(uuid: string, token: string) {
  const data = new TextEncoder().encode(`${uuid}:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export function getRunnerIdentityHeaders(event: H3Event) {
  const uuid = event.req.headers.get("x-runner-uuid")?.trim().toLowerCase();
  const token = event.req.headers.get("x-runner-token")?.trim();

  if (!uuid || !token) {
    throw new HTTPError({
      status: 401,
      message: "Missing runner identity headers",
    });
  }

  return { uuid, token };
}

export function getClientIp(event: H3Event, trustXForwardedFor: boolean) {
  return (
    getRequestIP(event, {
      xForwardedFor: trustXForwardedFor,
    }) ?? null
  );
}
