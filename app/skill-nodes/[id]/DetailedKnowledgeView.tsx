"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { STATUS_CONFIG } from "@/lib/constants";
import type { SkillNode, SkillNodeStatus } from "@/types/database";

type DetailedKnowledgeViewProps = {
  node: SkillNode;
  goalId: string;
};

export function DetailedKnowledgeView({ node, goalId }: DetailedKnowledgeViewProps) {
  const [detailedText, setDetailedText] = useState<string | null>(
    node.detailed_knowledge_text ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = STATUS_CONFIG[node.status as SkillNodeStatus] ?? STATUS_CONFIG.locked;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/skill-nodes/${node.id}/generate-detailed`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "生成に失敗しました");
      }
      const data = await res.json() as { detailed_knowledge_text: string };
      setDetailedText(data.detailed_knowledge_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0c0e14]/95 backdrop-blur-sm border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/goal/${goalId}`}
              className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              ← ゴール設定
            </Link>
            <div className="w-px h-4 bg-white/[0.08] shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 text-sm"
                style={{ color: config.color }}
              >
                {config.icon}
              </span>
              <h1
                className="text-[15px] text-gray-200 truncate"
                title={node.label}
              >
                {node.label}
              </h1>
              <span
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  color: config.color,
                  borderColor: `${config.color}40`,
                  backgroundColor: `${config.color}18`,
                }}
              >
                {config.label}
              </span>
            </div>
          </div>

          {detailedText && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="shrink-0 text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-500 hover:text-gray-300 hover:border-white/[0.15] transition-colors disabled:opacity-40"
            >
              {isGenerating ? "生成中..." : "再生成"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 概要テキスト */}
        {node.knowledge_text && (
          <div className="mb-8 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">概要</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              {node.knowledge_text}
            </p>
          </div>
        )}

        {/* 詳細テキスト or 生成ボタン */}
        {detailedText ? (
          <div className="prose-container">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-4">
              詳細学習テキスト
            </div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {detailedText}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="text-4xl">📖</div>
            <div className="text-center">
              <p className="text-gray-300 mb-1">詳細学習テキストが未生成です</p>
              <p className="text-sm text-gray-500">
                AIが「{node.label}」について約6000字の詳細テキストを生成します
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
                  生成中（30秒〜1分程度かかります）
                </span>
              ) : (
                "詳細学習テキストを生成する"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
