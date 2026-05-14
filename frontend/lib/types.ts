export type FeatureModule =
  | "Project"
  | "Board"
  | "List"
  | "Card"
  | "Views"
  | "Settings"
  | "Admin"
  | "Other";

export type CoverageStatus = "uncovered" | "covered" | "partial";

export type Feature = {
  feature_id: string;
  module: FeatureModule;
  title: string;
  summary: string;
  source_urls: string[];
  evidence_quotes: string[];
  confidence: number;
  coverage_status: CoverageStatus;
};

export type Priority = "P0" | "P1" | "P2";
export type Difficulty = "simple" | "medium" | "hard";
export type ReviewStatus = "auto_validated" | "needs_review" | "rejected";
export type RunStatus =
  | "queued"
  | "running"
  | "pass"
  | "fail"
  | "needs_review"
  | "cancelled"
  | "error";
export type RunVerdict = "pass" | "fail" | "needs_review";
export type ExpectationType =
  | "element_visible"
  | "text_present"
  | "url_match"
  | "element_state"
  | "containment"
  | "semantic";

export type TestStep = {
  order: number;
  action: string;
};

export type Expectation = {
  type: ExpectationType;
  description: string;
  params: Record<string, unknown>;
};

export type ScenarioSummary = {
  scenario_id: string;
  feature_id: string;
  title: string;
  priority: Priority;
  difficulty: Difficulty;
  review_status: ReviewStatus;
  latest_result?: RunVerdict | null;
  is_mutation: boolean;
};

export type TestScenario = ScenarioSummary & {
  source_urls: string[];
  evidence_quotes: string[];
  preconditions: string[];
  test_data: Record<string, unknown>;
  steps: TestStep[];
  expectations: Expectation[];
  max_steps: number;
  requires_visual_check: boolean;
};

export type Run = {
  run_id: string;
  scenario_ids: string[];
  status: RunStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  verdict: RunVerdict | null;
  failure_primary: string | null;
  failure_secondary: string[];
  artifact_dir: string;
  report_id: string | null;
  verification_results?: unknown[];
  failure_classification?: unknown;
  report_links?: Record<string, string>;
};

export type RuntimeSettings = {
  models: {
    text_llm_provider: "openai_compatible" | "deepseek" | "browser_use";
    openai_compatible_provider_name: string;
    openai_compatible_home_url: string;
    openai_compatible_base_url: string;
    openai_compatible_model: string;
    openai_compatible_note: string | null;
    openai_compatible_api_key_configured: boolean;
    deepseek_model: string;
    deepseek_api_key_configured: boolean;
    browser_use_model: string;
    browser_use_api_key_configured: boolean;
    browser_use_llm_fallback_enabled: boolean;
    browser_use_cloud_browser_enabled: boolean;
    glm_vision_model: string;
    glm_api_key_configured: boolean;
  };
};

export type RuntimeSettingsPatch = {
  models: {
    text_llm_provider?: "openai_compatible" | "deepseek" | "browser_use";
    openai_compatible_provider_name?: string;
    openai_compatible_home_url?: string;
    openai_compatible_base_url?: string;
    openai_compatible_api_key?: string | null;
    openai_compatible_model?: string;
    openai_compatible_note?: string | null;
    deepseek_model?: string;
    deepseek_api_key?: string | null;
    browser_use_model?: string;
    browser_use_api_key?: string | null;
    browser_use_llm_fallback_enabled?: boolean;
    browser_use_cloud_browser_enabled?: false;
    glm_vision_model?: string;
    glm_api_key?: string | null;
  };
};

export type DoctorCheckStatus = "ok" | "warning" | "error";

export type DoctorCheck = {
  status: DoctorCheckStatus;
  detail: string;
};

export type DoctorResponse = {
  status: DoctorCheckStatus;
  checks: Record<string, DoctorCheck>;
};

export type ListResponse<T> = {
  items: T[];
};

export type CreateRunResponse = {
  run_id: string;
  status: "queued";
  live_url: string;
};

export type TraceEventType =
  | "node_status"
  | "browser_step"
  | "browser_frame"
  | "verification"
  | "classification"
  | "repair"
  | "report"
  | "error";

export type TraceEvent = {
  event_id: string;
  run_id: string;
  ts: string;
  type: TraceEventType;
  node: string | null;
  status: string | null;
  message: string | null;
  payload: Record<string, unknown>;
};

export type TraceList = {
  items: TraceEvent[];
};

export type ArtifactList = {
  run_id: string;
  files: string[];
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BrowserFrame = {
  eventId: string;
  ts: string;
  src: string;
  artifactPath?: string;
  url?: string;
  step?: number;
  action?: string;
  targetBox?: BoundingBox;
};
