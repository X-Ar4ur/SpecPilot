"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpenCheck,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import logo from "../../../image/logo.png";
import { api } from "../../lib/api";
import { useAppStore } from "../../lib/store";
import { SettingsDrawer } from "./settings-drawer";

const navigation = [
  { label: "工作台", href: "/", icon: LayoutDashboard },
  { label: "手册生成", href: "/manual-generation", icon: BookOpenCheck },
  { label: "功能点树", href: "/features", icon: BookOpenText },
  { label: "测试场景", href: "/scenarios", icon: ListChecks },
  { label: "执行过程", href: "/runs/live", icon: FlaskConical },
  { label: "执行记录", href: "/runs", icon: History },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const openSettings = useAppStore((state) => state.openSettings);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });
  const provider =
    settingsQuery.data?.models.text_llm_provider ?? "openai_compatible";
  const model =
    provider === "openai_compatible"
      ? settingsQuery.data?.models.openai_compatible_model ?? "gpt-5.5"
      : provider === "browser_use"
        ? settingsQuery.data?.models.browser_use_model ?? "bu-latest"
        : settingsQuery.data?.models.deepseek_model ?? "deepseek-v4-pro";

  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-10 w-[160px] overflow-hidden">
            <img
              src={logo.src}
              alt="SpecPilot"
              className="h-[78px] w-auto max-w-none -translate-x-[34px] -translate-y-[19px] object-contain"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden rounded-md border border-line px-3 py-1.5 text-slate-600 md:inline-flex">
            {model}
          </span>
          <span
            className={`hidden rounded-md border px-3 py-1.5 md:inline-flex ${
              settingsQuery.isError
                ? "border-amber-200 bg-amber-50 text-warn"
                : "border-emerald-200 bg-emerald-50 text-pass"
            }`}
          >
            {settingsQuery.isError ? "设置接口离线" : "本地控制台就绪"}
          </span>
          <button
            className="grid h-9 w-9 place-items-center rounded-md border border-line hover:bg-slate-50"
            aria-label="通知"
          >
            <Bell size={17} />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-ink text-white"
            aria-label="系统设置"
            onClick={openSettings}
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-16 z-20 border-r border-line bg-white px-2 py-4 text-slate-700 shadow-sm transition-[width] ${
          collapsed ? "w-[64px]" : "w-[184px]"
        }`}
      >
        <nav className="space-y-2">
          {navigation.map((item) => {
            const active = isNavigationActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`flex min-h-11 items-center gap-2.5 rounded-md px-3 py-3 text-[15px] font-medium transition-colors ${
                  active
                    ? "border border-blue-100 bg-blue-50 text-run"
                    : "text-slate-700 hover:bg-slate-100 hover:text-ink"
                }`}
                href={item.href}
                title={item.label}
              >
                <item.icon size={18} />
                {!collapsed ? (
                  <span className="min-w-0 truncate">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <button
          className="absolute bottom-4 left-2 right-2 flex min-h-11 items-center justify-center gap-2 rounded-md border border-line py-2 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed ? <span className="min-w-0 truncate">收起</span> : null}
        </button>
      </aside>

      <main
        className={`min-h-screen pt-16 transition-[padding] ${
          collapsed ? "pl-[64px]" : "pl-[184px]"
        }`}
      >
        <div className="px-6 py-6">{children}</div>
      </main>
      <SettingsDrawer />
    </div>
  );
}

function isNavigationActive(pathname: string, href: string) {
  if (href === "/runs/live") {
    return pathname === href || pathname.startsWith("/runs/live/");
  }
  return pathname === href;
}
