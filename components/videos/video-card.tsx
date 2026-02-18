"use client";

import { useState } from "react";
import type { Video, VideoAnalysisStatus } from "@/types/database";

const STATUS_BADGE: Record<
  VideoAnalysisStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "解析済み",
    className: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  analyzing: {
    label: "解析中...",
    className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  pending: {
    label: "未解析",
    className: "text-gray-500 bg-white/4 border-white/6",
  },
  failed: {
    label: "失敗",
    className: "text-red-400 bg-red-500/10 border-red-500/20",
  },
};

type VideoCardProps = {
  video: Video;
  onClick: (video: Video) => void;
  onRetry?: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
};

export function VideoCard({ video, onClick, onRetry, onDelete }: VideoCardProps) {
  const [confirming, setConfirming] = useState(false);
  const status = video.analysis_status as VideoAnalysisStatus;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.pending;

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") onClick(video);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: outer div contains nested buttons, cannot use <button>
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-4 p-4 bg-white/2 rounded-xl border border-white/4 hover:bg-white/5 hover:border-white/8 transition-all cursor-pointer group"
      onClick={() => onClick(video)}
      onKeyDown={handleCardKeyDown}
    >
      {/* サムネイル */}
      <div className="w-20 h-[52px] rounded-lg bg-white/6 flex items-center justify-center text-2xl shrink-0 group-hover:bg-white/9 transition-colors">
        ▶
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-200 truncate">{video.title}</div>
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          {video.channel_name && <span>{video.channel_name}</span>}
          {video.channel_name && video.duration && <span>·</span>}
          {video.duration && <span>{video.duration}</span>}
        </div>
      </div>

      {/* バッジ + アクションボタン */}
      <div className="flex items-center gap-2 shrink-0">
        {(status === "failed" || status === "pending") && onRetry && (
          <button
            type="button"
            className="text-[11px] px-2.5 py-1 rounded-md text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onRetry(video.id);
            }}
          >
            再実行
          </button>
        )}
        <span
          className={`text-[11px] px-2.5 py-1 rounded-md border ${badge.className}`}
        >
          {badge.label}
        </span>
        {onDelete && !confirming && (
          <button
            type="button"
            className="text-[11px] px-2.5 py-1 rounded-md text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
          >
            削除
          </button>
        )}
        {onDelete && confirming && (
          <>
            <span className="text-[11px] text-red-400">本当に削除？</span>
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded-md text-red-400 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(false);
                onDelete(video.id);
              }}
            >
              削除
            </button>
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded-md text-gray-400 bg-white/4 border border-white/8 hover:bg-white/8 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(false);
              }}
            >
              戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}
