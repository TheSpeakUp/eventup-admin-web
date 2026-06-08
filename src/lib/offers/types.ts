export const OFFER_STATUSES = [
  "on_review",
  "active",
  "disabled",
  "rejected",
  "archived",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export function isOfferStatus(value: string): value is OfferStatus {
  return (OFFER_STATUSES as readonly string[]).includes(value);
}

export const QUEUE_STATUSES = [
  "in_sla",
  "warning",
  "overdue_response",
  "closed_without_response",
] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export function isQueueStatus(value: string): value is QueueStatus {
  return (QUEUE_STATUSES as readonly string[]).includes(value);
}

export type OfferModerationResponse = {
  offer_id: number;
  new_status: string;
  message_key: string | null;
  message: string;
};

export type SlaSummaryItem = {
  offer_id: number;
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  created_at: string;
  waiting_hours: number;
  queue_status: QueueStatus;
};

export type SlaCounters = {
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response_candidates: number;
};

export type SlaSummary = {
  generated_at: string;
  counters: SlaCounters;
  items: SlaSummaryItem[];
};

export type SlaSummaryQuery = {
  service_id?: number;
  service_ids?: number[];
  provider_id?: number;
  queue_status?: QueueStatus[];
  min_waiting_hours?: number;
  max_waiting_hours?: number;
  only_degraded_services?: boolean;
  min_overdue_share?: number;
  limit?: number;
};

export type OfferDetailCard = {
  offer_id: number;
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  offer_title: string | null;
  offer_description: string | null;
  status: OfferStatus;
  queue_status: QueueStatus;
  waiting_hours: number;
  created_at: string;
  updated_at: string | null;
  start_at: string | null;
  deadline: string | null;
  is_permanent: boolean;
  code: string | null;
  link: string | null;
  kind: string | null;
  recipient_type: number | null;
  percent_value: number | null;
  fixed_value_minor: number | null;
  currency: string | null;
};

export type ServiceHealthItem = {
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response: number;
  overdue_share: number;
  escalation_recommended: boolean;
};

export type ServiceHealthResponse = {
  generated_at: string;
  items: ServiceHealthItem[];
};

export type ProviderHealthItem = {
  provider_id: number;
  provider_name: string | null;
  services_total: number;
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response: number;
  overdue_share: number;
  escalation_recommended: boolean;
};

export type ProviderHealthResponse = {
  generated_at: string;
  items: ProviderHealthItem[];
};

export type DispatchRunLogItem = {
  id: string;
  dispatch_scope: string;
  status: string;
  actor_admin_id: string | null;
  actor_email: string | null;
  idempotency_key: string | null;
  created_at: string;
  finished_at: string | null;
  counts: Record<string, number>;
};

export type DispatchRunLogResponse = {
  items: DispatchRunLogItem[];
  total: number;
};

export type DispatchRunsQuery = {
  dispatch_scope?: string;
  status?: string;
  actor_admin_id?: string;
  idempotency_key?: string;
  limit?: number;
  offset?: number;
};

export type DlqItem = {
  dlq_key: string;
  source_run_id: string;
  dispatch_scope: string;
  provider_id: number;
  channel: string;
  detail: unknown;
  actor_admin_id: string | null;
  actor_email: string | null;
  operator_notes: string | null;
  incident_links: string[];
  request_payload: unknown;
  delivery_outcome: Record<string, unknown>;
  created_at: string;
};

export type DlqResponse = {
  items: DlqItem[];
  total: number;
};

export type DlqQuery = {
  source_run_id?: string;
  channel?: string;
  provider_id?: number;
  exclude_replayed_successes?: boolean;
  limit?: number;
  offset?: number;
};

export type OfferDispatchResponse = {
  generated_at: string;
  auto_close_enabled: boolean;
  checked_offers: number;
  reminders_sent: number;
  auto_closed: number;
  reminder_offer_ids: number[];
  auto_closed_offer_ids: number[];
  escalations_sent: number;
  escalated_service_ids: number[];
};

export type ProviderDispatchResponse = {
  generated_at: string;
  checked_providers: number;
  escalations_sent: number;
  escalated_provider_ids: number[];
  channels: string[];
  delivery_outcomes: Array<Record<string, unknown>>;
};

export type DlqReplayMode = "dry_run" | "apply";

export type DlqReplayRequest = {
  mode: DlqReplayMode;
  source_run_id?: string;
  channel?: string;
  provider_id?: number;
};

export type DlqReplayResponse = {
  mode: DlqReplayMode;
  total_candidates: number;
  processed_items: number;
  sent_replays: number;
  failed_replays: number;
  skipped_replays: number;
  channels: string[];
  replayed_keys: string[];
  candidates: Array<Record<string, unknown>>;
  delivery_outcomes: Array<Record<string, unknown>>;
  replay_run_id: string | null;
};
