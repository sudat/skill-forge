"use client";

import { useRef } from "react";
import type { TasteSettings, TasteFormality, TasteLength, TasteDepth } from "@/lib/constants";
import { TASTE_LABELS } from "@/lib/constants";

type Props = {
  settings: TasteSettings;
  onChange: (settings: TasteSettings) => void;
  onClose: () => void;
};

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  labels,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] border transition-all ${
              value === opt
                ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                : "border-white/[0.08] bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:border-white/[0.14]"
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TasteSettingsDialog({ settings, onChange, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[14px] text-gray-200">生成テイスト設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all text-sm"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <ToggleGroup<TasteFormality>
            label="親密さ"
            options={["formal", "normal", "friendly"] as const}
            value={settings.formality}
            labels={TASTE_LABELS.formality}
            onChange={(v) => onChange({ ...settings, formality: v })}
          />
          <ToggleGroup<TasteLength>
            label="文章の長さ"
            options={["short", "normal", "detailed"] as const}
            value={settings.length}
            labels={TASTE_LABELS.length}
            onChange={(v) => onChange({ ...settings, length: v })}
          />
          <ToggleGroup<TasteDepth>
            label="深さ"
            options={["intro", "standard", "deep"] as const}
            value={settings.depth}
            labels={TASTE_LABELS.depth}
            onChange={(v) => onChange({ ...settings, depth: v })}
          />
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-[13px] bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
}
