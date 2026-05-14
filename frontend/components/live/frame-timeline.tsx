"use client";

import type { BrowserFrame } from "../../lib/types";

export function FrameTimeline({
  frames,
  selectedEventId,
  onSelect,
}: {
  frames: BrowserFrame[];
  selectedEventId: string | null;
  onSelect: (frame: BrowserFrame) => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">帧时间线</h3>
        <span className="text-xs text-slate-500">{frames.length} frames</span>
      </div>
      {frames.length === 0 ? (
        <div className="grid h-24 place-items-center text-sm text-slate-500">
          暂无截图 artifact
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {frames.map((frame, index) => (
            <button
              key={frame.eventId}
              onClick={() => onSelect(frame)}
              className={`w-32 shrink-0 overflow-hidden rounded-md border text-left ${
                selectedEventId === frame.eventId
                  ? "border-run ring-2 ring-blue-100"
                  : "border-line"
              }`}
            >
              <div className="h-20 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.src}
                  alt={`frame ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-2 py-1 text-xs">
                <div className="font-medium">#{index + 1}</div>
                <div className="truncate text-slate-500">
                  {frame.action ?? frame.artifactPath ?? "browser_frame"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
