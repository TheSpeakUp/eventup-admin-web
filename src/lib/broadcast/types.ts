// Mirrors src/eventup/admin/marketplace/broadcast_admin_schemas.py.
export const BROADCAST_AUDIENCES = [
  "all",
  "verified",
  "pending",
  "blocked",
] as const;

export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number];

export type BroadcastPreview = {
  audience: string;
  providers: number;
  recipients: number;
};

export type BroadcastResult = {
  broadcast_id: string;
  audience: string;
  providers: number;
  recipients: number;
  enqueued: number;
};

export type BroadcastBody = {
  title: string;
  body: string;
  audience: BroadcastAudience;
  action_url?: string;
};
