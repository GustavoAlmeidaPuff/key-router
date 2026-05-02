export interface ProxyKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

export interface OpenRouterKey {
  id: string;
  name: string;
  key: string;
  rate_limited_until: string | null;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  is_active: boolean;
}
