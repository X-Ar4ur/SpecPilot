"use client";

import { ImageOff, Maximize2 } from "lucide-react";

import type { BrowserFrame } from "../../lib/types";

export function BrowserFrameView({ frame }: { frame: BrowserFrame | null }) {
  return (
    <section className="flex min-h-[520px] flex-col rounded-lg border border-[#26324a] bg-[#0f172a] text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">浏览器画面</h3>
          <p className="mt-1 truncate text-xs text-slate-400">
            {frame?.url ?? "等待 browser_frame"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>step {frame?.step ?? "--"}</span>
          <Maximize2 size={15} />
        </div>
      </div>
      <div className="relative grid flex-1 place-items-center overflow-hidden bg-black">
        {frame ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frame.src}
              alt="browser frame"
              className="max-h-full max-w-full object-contain"
            />
            {frame.targetBox ? (
              <div
                className="pointer-events-none absolute border-2 border-red-500 bg-red-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]"
                style={{
                  left: `${frame.targetBox.x}%`,
                  top: `${frame.targetBox.y}%`,
                  width: `${frame.targetBox.width}%`,
                  height: `${frame.targetBox.height}%`,
                }}
              />
            ) : null}
          </>
        ) : (
          <div className="grid place-items-center text-center text-sm text-slate-400">
            <ImageOff className="mb-3" size={28} />
            暂无截图帧
          </div>
        )}
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">
        {frame?.action ?? "最新 action 会显示在这里"}
      </div>
    </section>
  );
}
