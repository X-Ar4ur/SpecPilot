import { FeatureTree } from "../../components/features/feature-tree";

export default function FeaturesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Feature Map"
        title="功能点树"
        description="按手册模块查看功能点、证据来源、覆盖状态和置信度。"
      />
      <FeatureTree />
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-run">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </header>
  );
}
