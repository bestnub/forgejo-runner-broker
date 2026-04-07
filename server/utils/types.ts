export type RunnerRole = "preferred" | "fallback" | "unassigned";

export interface AppConfig {
  forgejoBaseUrl: string;
  preferredRunnerUuids: string[];
  fallbackRunnerUuids: string[];
  preferredRunnerTtlSeconds: number;
  blockUnassignedRunners: boolean;
  trustXForwardedFor: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface RunnerState {
  uuid: string;
  role: RunnerRole;
  tokenFingerprint: string;
  displayName: string;
  userAgent: string | null;
  remoteIp: string | null;
  lastSeenAt: string | null;
  lastFetchAt: string | null;
  lastBlockedAt: string | null;
  firstSeenAt: string;
  updatedAt: string;
}
