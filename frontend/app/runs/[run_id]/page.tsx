import { RunDetail } from "../../../components/runs/run-detail";

export default function RunDetailPage({
  params,
}: {
  params: { run_id: string };
}) {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-run">
          Run Detail
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{params.run_id}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          执行摘要、失败分类、报告链接和原始 JSON。
        </p>
      </header>
      <RunDetail runId={params.run_id} />
    </div>
  );
}
