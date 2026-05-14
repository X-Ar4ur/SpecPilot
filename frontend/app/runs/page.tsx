import { RunHistory } from "../../components/runs/run-history";

export default function RunsPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-run">
          Run History
        </p>
        <h2 className="mt-1 text-2xl font-semibold">执行记录</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          查看历史运行、失败分类、报告编号和 artifact 入口。
        </p>
      </header>
      <RunHistory />
    </div>
  );
}
