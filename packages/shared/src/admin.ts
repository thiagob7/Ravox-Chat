import type { PremiumSource } from "./plans.js";

export const ADMIN_AREAS = [
  "publicacoes",
  "aprovar",
  "servidor",
  "denuncias",
  "comunicado",
  "comunidades",
  "administradores",
  "premium",
  "ads",
] as const;

export type AdminArea = (typeof ADMIN_AREAS)[number];

export const ADMIN_TOKEN_HEADER = "x-gravae-admin";

export const ADMIN_PASSWORD_MIN = 10;

export const isAdminArea = (value: unknown): value is AdminArea =>
  ADMIN_AREAS.includes(value as AdminArea);

export interface AdminMe {
  role: "dono" | "admin";
  email: string;
  areas: AdminArea[];
  locked: boolean;
  mustChangePassword: boolean;
}

export interface AdminMemberView {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  areas: AdminArea[];
  mustChangePassword: boolean;
  addedBy: string | null;
  createdAt: string;
  lastUnlockAt: string | null;
}

export interface AdminOwnerView {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PremiumAccount {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  premiumUntil: string | null;
  premiumSource: PremiumSource | null;
}

export interface AdminLogEntry {
  id: string;
  actor: string;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export type WorkflowState = "esperando" | "rodando" | "boa" | "falhou" | "cancelada";

export interface WorkflowStep {
  name: string;
  state: WorkflowState;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WorkflowJob {
  name: string;
  state: WorkflowState;
  startedAt: string | null;
  completedAt: string | null;
  steps: WorkflowStep[];
  link: string;
}

export interface WorkflowRun {
  id: number;
  workflow: string;
  title: string;
  branch: string;
  commit: string;
  actor: string | null;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
  link: string;
  jobs: WorkflowJob[];
  pending: { environment: string; canApprove: boolean }[];
  reviews: { user: string; state: string; comment: string | null }[];
}

export interface WebDeploy {
  environment: string;
  commit: string;
  state: WorkflowState;
  createdAt: string;
  link: string | null;
}

export interface PendingCommit {
  sha: string;
  message: string;
  author: string | null;
  when: string;
}

export interface PublicationsView {
  repository: string;
  tokenConfigured: boolean;
  canApprove: boolean;
  branches: Record<"master" | "staging" | "dev", { sha: string; message: string; when: string } | null>;
  web: WebDeploy[];
  runs: WorkflowRun[];
  toShip: { count: number; commits: PendingCommit[] };
  error: string | null;
}
