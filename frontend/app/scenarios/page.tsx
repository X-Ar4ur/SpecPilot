import { ScenarioTable } from "../../components/scenarios/scenario-table";

export default function ScenariosPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-run">
          Scenario Console
        </p>
        <h2 className="mt-1 text-2xl font-semibold">测试场景</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          查看零 locator 场景、审核状态、步骤、预期结果与证据 JSON。
        </p>
      </header>
      <ScenarioTable />
    </div>
  );
}
