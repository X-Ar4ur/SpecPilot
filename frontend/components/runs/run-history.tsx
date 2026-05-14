"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, FileJson, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { api } from "../../lib/api";
import type { Run } from "../../lib/types";

const runHistoryColumns =
  "minmax(300px,1.6fr) minmax(150px,0.8fr) 92px 104px minmax(132px,0.8fr) minmax(240px,1.1fr) 88px";

export function RunHistory() {
  const [query, setQuery] = useState("");
  const runsQuery = useQuery({ queryKey: ["runs"], queryFn: api.listRuns });
  const filtered = useMemo(
    () => {
      const runs = runsQuery.data?.items ?? [];
      return runs.filter((run) => {
        const text = [
          run.run_id,
          run.status,
          run.verdict ?? "",
          run.failure_primary ?? "",
          ...run.scenario_ids,
        ].join(" ");
        return text.includes(query);
      });
    },
    [query, runsQuery.data?.items],
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索 run、状态、场景或失败类型"
          className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-run"
        />
      </div>
      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div
              className="grid items-center gap-4 border-b border-line bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500"
              style={{ gridTemplateColumns: runHistoryColumns }}
            >
              <span>Run</span>
              <span>场景</span>
              <span className="text-center">状态</span>
              <span>耗时</span>
              <span>失败主因</span>
              <span>报告</span>
              <span className="text-right">详情</span>
            </div>
            {runsQuery.isError ? (
              <EmptyRow text="执行记录接口暂不可用" />
            ) : filtered.length === 0 ? (
              <EmptyRow text="暂无执行记录" />
            ) : (
              <div className="divide-y divide-line">
                {filtered.map((run) => (
                  <RunRow key={run.run_id} run={run} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RunRow({ run }: { run: Run }) {
  return (
    <div
      className="grid items-center gap-4 px-4 py-3 text-sm"
      style={{ gridTemplateColumns: runHistoryColumns }}
    >
      <div className="min-w-0">
        <Link
          href={`/runs/${run.run_id}`}
          title={run.run_id}
          className="block truncate font-mono text-sm font-semibold text-slate-900"
        >
          {run.run_id}
        </Link>
        <p className="mt-1 text-xs text-slate-500">
          {formatDate(run.started_at)}
        </p>
      </div>
      <span
        className="min-w-0 truncate text-slate-600"
        title={run.scenario_ids.join(", ")}
      >
        {run.scenario_ids.join(", ")}
      </span>
      <div className="flex justify-center">
        <StatusBadge value={run.status} />
      </div>
      <span className="flex items-center gap-1 text-slate-600 tabular-nums">
        <Clock3 size={14} />
        {formatDuration(run.duration_ms)}
      </span>
      <span className="min-w-0 truncate text-slate-600" title={run.failure_primary ?? "--"}>
        {run.failure_primary ?? "--"}
      </span>
      <span
        className="flex min-w-0 items-center gap-1 text-slate-600"
        title={run.report_id ?? "--"}
      >
        <FileJson size={14} />
        <span className="truncate">{run.report_id ?? "--"}</span>
      </span>
      <div className="text-right">
        <Link
          href={`/runs/${run.run_id}`}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-slate-50"
        >
          打开
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const classes =
    value === "pass"
      ? "border-emerald-200 bg-emerald-50 text-pass"
      : value === "fail" || value === "error"
        ? "border-red-200 bg-red-50 text-fail"
        : value === "running"
          ? "border-blue-200 bg-blue-50 text-run"
          : value === "needs_review"
            ? "border-amber-200 bg-amber-50 text-warn"
            : "border-slate-200 bg-slate-50 text-slate-500";
  return <span className={`w-fit rounded border px-2 py-1 text-xs ${classes}`}>{value}</span>;
}

function formatDuration(value: number | null) {
  if (value === null) {
    return "--";
  }
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  return `${Math.round(value / 1000)}s`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "未开始";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-10 text-center text-sm text-slate-500">{text}</div>;
}
