"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { api } from "../../lib/api";
import type { Feature, FeatureModule } from "../../lib/types";

const moduleOrder: FeatureModule[] = [
  "Project",
  "Board",
  "List",
  "Card",
  "Views",
  "Settings",
  "Admin",
  "Other",
];

const moduleLabels: Record<FeatureModule, string> = {
  Project: "Project",
  Board: "Board",
  List: "List",
  Card: "Card",
  Views: "Views",
  Settings: "Settings",
  Admin: "Admin",
  Other: "Other",
};

const coverageLabels = {
  covered: "已覆盖",
  partial: "部分覆盖",
  uncovered: "未覆盖",
};

export function FeatureTree() {
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const featuresQuery = useQuery({
    queryKey: ["features"],
    queryFn: api.listFeatures,
  });
  const filtered = useMemo(
    () => {
      const features = featuresQuery.data?.items ?? [];
      return features.filter((feature) => {
        const matchesQuery =
          feature.title.includes(query) ||
          feature.summary.includes(query) ||
          feature.module.includes(query);
        const matchesCoverage =
          coverage === "all" || feature.coverage_status === coverage;
        return matchesQuery && matchesCoverage;
      });
    },
    [featuresQuery.data?.items, query, coverage],
  );
  const grouped = useMemo(() => {
    return moduleOrder.map((module) => ({
      module,
      items: filtered
        .filter((feature) => feature.module === module)
        .sort((left, right) => right.confidence - left.confidence),
    }));
  }, [filtered]);
  const selected =
    filtered.find((feature) => feature.feature_id === selectedId) ??
    filtered[0] ??
    null;

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索模块、功能点、摘要"
              className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-run"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select
              value={coverage}
              onChange={(event) => setCoverage(event.target.value)}
              className="h-10 rounded-md border border-line bg-white pl-9 pr-8 text-sm outline-none focus:border-run"
            >
              <option value="all">全部覆盖</option>
              <option value="covered">已覆盖</option>
              <option value="partial">部分覆盖</option>
              <option value="uncovered">未覆盖</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white">
          {featuresQuery.isError ? (
            <EmptyMessage text="功能点接口暂不可用" />
          ) : filtered.length === 0 ? (
            <EmptyMessage text="暂无功能点数据" />
          ) : (
            <div className="divide-y divide-line">
              {grouped
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.module} className="py-3">
                    <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {moduleLabels[group.module]}
                    </div>
                    <div className="space-y-1 px-2">
                      {group.items.map((feature) => (
                        <button
                          key={feature.feature_id}
                          onClick={() => setSelectedId(feature.feature_id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                            selected?.feature_id === feature.feature_id
                              ? "bg-run text-white"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="block font-medium">{feature.title}</span>
                          <span className="mt-1 block text-xs opacity-80">
                            {coverageLabels[feature.coverage_status]} ·{" "}
                            {Math.round(feature.confidence * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <FeatureDetail feature={selected} />
    </div>
  );
}

function FeatureDetail({ feature }: { feature: Feature | null }) {
  if (!feature) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-white p-6 text-sm text-slate-500">
        选择一个功能点查看证据、覆盖状态和关联信息。
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-run">
            {feature.module}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{feature.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {feature.summary}
          </p>
        </div>
        <span className="rounded-md border border-line px-3 py-1.5 text-sm">
          {coverageLabels[feature.coverage_status]}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Metric label="证据数量" value={String(feature.evidence_quotes.length)} />
        <Metric label="来源 URL" value={String(feature.source_urls.length)} />
        <Metric label="置信度" value={`${Math.round(feature.confidence * 100)}%`} />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">手册证据</h3>
        <div className="space-y-2">
          {feature.evidence_quotes.map((quote) => (
            <blockquote
              key={quote}
              className="border-l-2 border-run bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {quote}
            </blockquote>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">来源</h3>
        <div className="space-y-2">
          {feature.source_urls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-run hover:bg-slate-50"
            >
              <ExternalLink size={15} />
              <span className="truncate">{url}</span>
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-500">{text}</div>;
}
