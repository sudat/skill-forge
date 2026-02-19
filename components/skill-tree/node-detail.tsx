"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_CONFIG, DEFAULT_TASTE_SETTINGS, TASTE_STORAGE_KEY } from "@/lib/constants";
import type { TasteSettings } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { SkillNode, SkillNodeStatus, VideoNodeMapping, Video } from "@/types/database";

type MappedVideo = VideoNodeMapping & { video: Video };

type NodeDetailProps = {
  node: SkillNode | null;
  onStatusChange?: (nodeId: string, status: SkillNodeStatus) => void;
};

export function NodeDetail({ node, onStatusChange }: NodeDetailProps) {
  const [mappedVideos, setMappedVideos] = useState<MappedVideo[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasDetailedText, setHasDetailedText] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!node) return;
    setMappedVideos([]);
    setHasDetailedText(!!node.detailed_knowledge_text);
    setGenerateError(null);

    const supabase = createClient();
    supabase
      .from("video_node_mappings")
      .select("*, video:videos(*)")
      .eq("node_id", node.id)
      .order("relevance_score", { ascending: false })
      .then(({ data }) => {
        if (data) setMappedVideos(data as MappedVideo[]);
      });
  }, [node]);

  const handleGenerate = async () => {
    if (!node) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      let tasteSettings: TasteSettings = DEFAULT_TASTE_SETTINGS;
      try {
        const stored = localStorage.getItem(TASTE_STORAGE_KEY);
        if (stored) tasteSettings = JSON.parse(stored) as TasteSettings;
      } catch { /* 読取失敗時はデフォルトを使う */ }

      const res = await fetch(`/api/skill-nodes/${node.id}/generate-detailed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasteSettings),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "生成に失敗しました");
      }
      setHasDetailedText(true);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="text-3xl mb-3">←</div>
          <p className="text-sm text-[var(--text-secondary)]">スキルノードを選択してください</p>
        </div>
      </div>
    );
  }

  const status = node.status as SkillNodeStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.locked;

  const statusOptions: SkillNodeStatus[] = [
    "mastered",
    "learned",
    "in_progress",
    "available",
    "locked",
  ];

  const handleStatusChange = async (newStatus: SkillNodeStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const supabase = createClient();
      await supabase
        .from("skill_nodes")
        .update({ status: newStatus })
        .eq("id", node.id);
      onStatusChange?.(node.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full bg-[var(--bg-primary)]">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-lg shrink-0"
            style={{ color: config.color, textShadow: config.glow }}
          >
            {config.icon}
          </span>
          <h2 className="text-xl text-[var(--text-primary)] leading-snug">{node.label}</h2>
        </div>
        <span
          className="shrink-0 text-xs px-2.5 py-1 rounded-md border"
          style={{
            color: config.color,
            borderColor: `${config.color}40`,
            backgroundColor: `${config.color}18`,
          }}
        >
          {config.label}
        </span>
      </div>

      {/* カバレッジスコア */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">カバレッジスコア</span>
          <span className="text-sm font-mono" style={{ color: config.color }}>
            {node.coverage_score}%
          </span>
        </div>
        <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${node.coverage_score}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
      </div>

      {/* ステータス変更 */}
      <div className="mb-6">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">ステータスを変更</p>
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((s) => {
            const sc = STATUS_CONFIG[s];
            const isActive = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={isUpdating || isActive}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? "opacity-100 cursor-default"
                    : "opacity-40 hover:opacity-70 cursor-pointer"
                }`}
                style={{
                  color: sc.color,
                  borderColor: `${sc.color}40`,
                  backgroundColor: isActive ? `${sc.color}18` : "transparent",
                }}
              >
                {sc.icon} {sc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* knowledge_text */}
      {node.knowledge_text && (
        <div className="mb-4">
          <h3 className="text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
            学習テキスト（概要）
          </h3>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {node.knowledge_text}
            </p>
          </div>
        </div>
      )}

      {/* 詳細学習テキスト */}
      <div className="mb-6">
        <h3 className="text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
          詳細学習テキスト
        </h3>
        <div className="flex items-center gap-2">
          {!hasDetailedText && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-3 h-3 border border-[var(--accent-primary)]/40 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                "詳細テキストを生成"
              )}
            </button>
          )}
          {hasDetailedText && (
            <Link
              href={`/skill-nodes/${node.id}`}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-[var(--accent-secondary)]/30 text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/10 transition-colors"
            >
              詳細テキストを見る →
            </Link>
          )}
        </div>
        {generateError && (
          <p className="text-[11px] text-red-500 mt-2">{generateError}</p>
        )}
      </div>

      {/* マッピング済み動画 */}
      <div>
        <h3 className="text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
          関連動画 ({mappedVideos.length}本)
        </h3>
        {mappedVideos.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            まだ動画がマッピングされていません
          </p>
        ) : (
          <div className="space-y-2">
            {mappedVideos.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="text-[13px] text-[var(--text-primary)] leading-snug">
                    {m.video.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--accent-secondary)] font-mono">
                    {m.relevance_score}%
                  </span>
                </div>
                {m.coverage_detail && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {m.coverage_detail}
                  </p>
                )}
                {(m.timestamp_start || m.timestamp_end) && (
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                    {m.timestamp_start && `▶ ${m.timestamp_start}`}
                    {m.timestamp_start && m.timestamp_end && " 〜 "}
                    {m.timestamp_end && m.timestamp_end}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
