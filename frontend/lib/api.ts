import type {
  ArtifactList,
  CreateRunResponse,
  DoctorResponse,
  Feature,
  ListResponse,
  Run,
  RuntimeSettings,
  RuntimeSettingsPatch,
  ScenarioSummary,
  TestScenario,
  TraceList,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function fetchJson<T>(
  path: string,
  init: RequestInit & { body?: BodyInit | null } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  async listFeatures() {
    return fetchJson<ListResponse<Feature>>("/api/features");
  },
  async listScenarios(filters: Record<string, string | boolean | undefined> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return fetchJson<ListResponse<ScenarioSummary>>(
      `/api/scenarios${query ? `?${query}` : ""}`,
    );
  },
  async getScenario(scenarioId: string) {
    return fetchJson<TestScenario>(`/api/scenarios/${scenarioId}`);
  },
  async createRun(scenarioIds: string[]) {
    return fetchJson<CreateRunResponse>("/api/runs", {
      method: "POST",
      body: JSON.stringify({
        scenario_ids: scenarioIds,
        mode: scenarioIds.length === 1 ? "single" : "suite",
        config: {},
      }),
    });
  },
  async listRuns() {
    return fetchJson<ListResponse<Run>>("/api/runs");
  },
  async getRun(runId: string) {
    return fetchJson<Run>(`/api/runs/${runId}`);
  },
  async getRunArtifacts(runId: string) {
    return fetchJson<ArtifactList>(`/api/runs/${runId}/artifacts`);
  },
  async getRunTrace(runId: string) {
    return fetchJson<TraceList>(`/api/runs/${runId}/trace`);
  },
  runReportUrl(runId: string, format: "json" | "html" | "pdf") {
    return `${API_BASE_URL}/api/runs/${runId}/report?format=${format}`;
  },
  async getSettings() {
    return fetchJson<RuntimeSettings>("/api/settings");
  },
  async updateSettings(patch: RuntimeSettingsPatch) {
    return fetchJson<RuntimeSettings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async getDoctor() {
    return fetchJson<DoctorResponse>("/api/doctor");
  },
};
