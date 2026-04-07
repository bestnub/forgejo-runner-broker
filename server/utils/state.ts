import type { AppConfig, RunnerRole, RunnerState } from "./types";

const runners = new Map<string, RunnerState>();

function nowIso() {
  return new Date().toISOString();
}

export function resolveRunnerRole(uuid: string, config: AppConfig): RunnerRole {
  const normalized = uuid.trim().toLowerCase();

  if (config.preferredRunnerUuids.includes(normalized)) {
    return "preferred";
  }

  if (config.fallbackRunnerUuids.includes(normalized)) {
    return "fallback";
  }

  return "unassigned";
}

export function upsertRunner(params: {
  uuid: string;
  tokenFingerprint: string;
  userAgent: string | null;
  remoteIp: string | null;
  config: AppConfig;
}) {
  const uuid = params.uuid.trim().toLowerCase();
  const existing = runners.get(uuid);
  const currentTime = nowIso();
  const role = resolveRunnerRole(uuid, params.config);

  const next: RunnerState = {
    uuid,
    role,
    tokenFingerprint: params.tokenFingerprint,
    displayName: existing?.displayName ?? `runner-${uuid.slice(0, 8)}`,
    userAgent: params.userAgent,
    remoteIp: params.remoteIp,
    lastSeenAt: currentTime,
    lastFetchAt: existing?.lastFetchAt ?? null,
    lastBlockedAt: existing?.lastBlockedAt ?? null,
    firstSeenAt: existing?.firstSeenAt ?? currentTime,
    updatedAt: currentTime,
  };

  runners.set(uuid, next);
  return next;
}

export function markRunnerSeen(uuid: string) {
  const existing = runners.get(uuid);
  if (!existing) return;

  const currentTime = nowIso();
  runners.set(uuid, {
    ...existing,
    lastSeenAt: currentTime,
    updatedAt: currentTime,
  });
}

export function markRunnerFetch(uuid: string) {
  const existing = runners.get(uuid);
  if (!existing) return;

  const currentTime = nowIso();
  runners.set(uuid, {
    ...existing,
    lastSeenAt: currentTime,
    lastFetchAt: currentTime,
    updatedAt: currentTime,
  });
}

export function markRunnerBlocked(uuid: string) {
  const existing = runners.get(uuid);
  if (!existing) return;

  const currentTime = nowIso();
  runners.set(uuid, {
    ...existing,
    lastSeenAt: currentTime,
    lastBlockedAt: currentTime,
    updatedAt: currentTime,
  });
}

export function listRunners() {
  return Array.from(runners.values()).sort((a, b) =>
    a.uuid.localeCompare(b.uuid),
  );
}

export function getRunner(uuid: string) {
  return runners.get(uuid.trim().toLowerCase()) ?? null;
}

export function preferredRunnerAvailable(config: AppConfig) {
  const ttlMs = config.preferredRunnerTtlSeconds * 1000;

  return config.preferredRunnerUuids.some((uuid) => {
    const runner = getRunner(uuid);
    if (!runner?.lastSeenAt) return false;
    return Date.now() - new Date(runner.lastSeenAt).getTime() <= ttlMs;
  });
}
