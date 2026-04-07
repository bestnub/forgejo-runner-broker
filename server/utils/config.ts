import type { H3Event } from "nitro";
import { HTTPError } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import type { AppConfig } from "./types";

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return fallback;
}

function parsePositiveNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function parseUuidList(value: unknown): string[] {
  if (typeof value !== "string") return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function normalizeBaseUrl(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HTTPError({
      status: 500,
      message: "forgejoBaseUrl is not configured",
    });
  }

  return new URL(value.trim()).toString().replace(/\/+$/, "");
}

export function getAppConfig(event?: H3Event): AppConfig {
  const runtime = useRuntimeConfig();

  const logLevel = String(runtime.logLevel ?? "info");
  const normalizedLogLevel: AppConfig["logLevel"] =
    logLevel === "debug" ||
    logLevel === "info" ||
    logLevel === "warn" ||
    logLevel === "error"
      ? logLevel
      : "info";

  return {
    forgejoBaseUrl: normalizeBaseUrl(runtime.forgejoBaseUrl),
    preferredRunnerUuids: parseUuidList(runtime.preferredRunnerUuids),
    fallbackRunnerUuids: parseUuidList(runtime.fallbackRunnerUuids),
    preferredRunnerTtlSeconds: parsePositiveNumber(
      runtime.preferredRunnerTtlSeconds,
      15,
    ),
    blockUnassignedRunners: parseBoolean(runtime.blockUnassignedRunners, false),
    trustXForwardedFor: parseBoolean(runtime.trustXForwardedFor, true),
    logLevel: normalizedLogLevel,
  };
}

export function getPublicConfig(event?: H3Event) {
  const config = getAppConfig(event);

  return {
    forgejoBaseUrl: config.forgejoBaseUrl,
    preferredRunnerUuids: config.preferredRunnerUuids,
    fallbackRunnerUuids: config.fallbackRunnerUuids,
    preferredRunnerTtlSeconds: config.preferredRunnerTtlSeconds,
    blockUnassignedRunners: config.blockUnassignedRunners,
    trustXForwardedFor: config.trustXForwardedFor,
    logLevel: config.logLevel,
  };
}
