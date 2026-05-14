"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  Play,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../lib/api";
import type { Run } from "../lib/types";

const statusColors = {
  pass: "#15803D",
  fail: "#DC2626",
  needs_review: "#B45309",
  running: "#2563EB",
  queued: "#64748B",
  error: "#DC2626",
  cancelled: "#64748B",
};

export default function Home() {
  const featuresQuery = useQuery({
    queryKey: ["features"],
    queryFn: api.listFeatures,
  });
  const scenariosQuery = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => api.listScenarios(),
  });
  const runsQuery = useQuery({ queryKey: ["runs"], queryFn: api.listRuns });
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });
  const features = featuresQuery.data?.items ?? [];
  const scenarios = scenariosQuery.data?.items ?? [];
  const runs = runsQuery.data?.items ?? [];
  const provider =
    settingsQuery.data?.models.text_llm_provider ?? "openai_compatible";
  const model =
    provider === "openai_compatible"
      ? settingsQuery.data?.models.openai_compatible_model ?? "gpt-5.5"
      : provider === "browser_use"
        ? settingsQuery.data?.models.browser_use_model ?? "bu-latest"
        : settingsQuery.data?.models.deepseek_model ?? "deepseek-v4-pro";
  const passCount = runs.filter((run) => run.verdict === "pass").length;
  const failCount = runs.filter((run) => run.verdict === "fail").length;
  const runningCount = runs.filter((run) => run.status === "running").length;
  const passRate =
    runs.length > 0 ? `${Math.round((passCount / runs.length) * 100)}%` : "--";
  const avgDuration = averageDuration(runs);
  const difficultyData = ["simple", "medium", "hard"].map((difficulty) => ({
    name:
      difficulty === "simple"
        ? "简单"
        : difficulty === "medium"
          ? "中等"
          : "困难",
    value: scenarios.filter((scenario) => scenario.difficulty === difficulty)
      .length,
  }));
  const failureData = summarizeFailures(runs);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-run">
            Workbench
          </p>
          <h2 className="mt-1 text-2xl font-semibold">工作台</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            手册索引、场景生成、browser-use 执行与验证报告的集中视图。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/features" icon={<BookOpenText size={16} />}>
            功能点
          </ActionLink>
          <ActionLink href="/scenarios" icon={<ListChecks size={16} />}>
            场景表
          </ActionLink>
          <ActionLink href="/runs" icon={<FileText size={16} />}>
            执行记录
          </ActionLink>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="功能点"
          value={String(features.length)}
          hint="手册证据驱动"
          icon={<BookOpenText size={18} />}
        />
        <Metric
          label="测试场景"
          value={String(scenarios.length)}
          hint="自然语言步骤"
          icon={<ListChecks size={18} />}
        />
        <Metric
          label="运行中"
          value={String(runningCount)}
          hint="browser-use 本地执行"
          icon={<Activity size={18} />}
        />
        <Metric
          label="通过率"
          value={passRate}
          hint={`失败 ${failCount} 次`}
          icon={<ShieldCheck size={18} />}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">场景难度分布</h3>
            <span className="text-xs text-slate-500">{scenarios.length} 条</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">失败分类分布</h3>
            <span className="text-xs text-slate-500">最近执行记录</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {failureData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-sm font-semibold">最近执行</h3>
            <Link href="/runs" className="text-sm text-run">
              查看全部
            </Link>
          </div>
          {runs.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">暂无执行记录</div>
          ) : (
            <div className="divide-y divide-line">
              {runs.slice(0, 5).map((run) => (
                <div
                  key={run.run_id}
                  className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-sm"
                >
                  <Link href={`/runs/${run.run_id}`} className="font-medium">
                    {run.run_id}
                  </Link>
                  <StatusBadge value={run.status} />
                  <span className="text-right text-slate-500">
                    {formatDuration(run.duration_ms)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-line bg-[#111827] p-5 text-slate-100">
          <h3 className="text-sm font-semibold">执行控制台</h3>
          <div className="mt-4 space-y-3 font-mono text-sm">
            <ConsoleLine icon={<CheckCircle2 size={15} />} text="executor=browser-use" />
            <ConsoleLine icon={<Play size={15} />} text={`text_model=${model}`} />
            <ConsoleLine icon={<Clock3 size={15} />} text={`avg_duration=${avgDuration}`} />
            <ConsoleLine icon={<ShieldCheck size={15} />} text="scenario_mode=zero-locator" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-run">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function ActionLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}

function ConsoleLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
      <span className="text-run">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const color =
    statusColors[value as keyof typeof statusColors] ?? statusColors.queued;
  return (
    <span
      className="w-fit rounded border px-2 py-1 text-xs"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}12`, color }}
    >
      {value}
    </span>
  );
}

function summarizeFailures(runs: Run[]) {
  const counts = new Map<string, number>();
  runs.forEach((run) => {
    if (run.failure_primary) {
      counts.set(run.failure_primary, (counts.get(run.failure_primary) ?? 0) + 1);
    }
  });
  const entries = Array.from(counts.entries());
  if (entries.length === 0) {
    return [{ name: "暂无失败", value: 1, color: "#CBD5E1" }];
  }
  const palette = ["#DC2626", "#B45309", "#2563EB", "#15803D", "#7C3AED"];
  return entries.map(([name, value], index) => ({
    name,
    value,
    color: palette[index % palette.length],
  }));
}

function averageDuration(runs: Run[]) {
  const values = runs
    .map((run) => run.duration_ms)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) {
    return "--";
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return formatDuration(avg);
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
