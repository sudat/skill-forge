"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { VideoCard } from "./video-card";
import { VideoRegisterModal } from "./video-register-modal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Video, VideoAnalysisStatus, KeyPoint } from "@/types/database";

type VideoDetailModalProps = {
  video: Video;
  onClose: () => void;
};

function VideoDetailModal({ video, onClose }: VideoDetailModalProps) {
  const keyPoints = (video.key_points as KeyPoint[] | null) ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <h2 className="text-[15px] text-[var(--text-primary)] truncate flex-1 mr-4">{video.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-all shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* メタ情報 */}
          <div className="flex gap-3 flex-wrap text-xs text-[var(--text-tertiary)]">
            {video.channel_name && <span>📺 {video.channel_name}</span>}
            {video.duration && <span>⏱ {video.duration}</span>}
            {video.url && (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-secondary)] hover:opacity-80 underline"
              >
                動画を開く →
              </a>
            )}
          </div>

          {/* サマリー */}
          {video.summary && (
            <div>
              <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">サマリー</h3>
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{video.summary}</p>
              </div>
            </div>
          )}

          {/* キーポイント */}
          {keyPoints.length > 0 && (
            <div>
              <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                キーポイント ({keyPoints.length})
              </h3>
              <div className="space-y-2">
                {keyPoints.map((kp, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]"
                  >
                    <span className="text-[var(--accent-primary)] shrink-0 text-sm">◆</span>
                    <div>
                      <div className="text-[13px] text-[var(--text-primary)]">{kp.topic}</div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{kp.description}</div>
                      {kp.timestamp && (
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{kp.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 解析状態メッセージ */}
          {video.analysis_status === "pending" && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-4">解析待機中...</p>
          )}
          {video.analysis_status === "analyzing" && (
            <p className="text-sm text-yellow-400 text-center py-4">AI解析中...</p>
          )}
          {video.analysis_status === "failed" && (
            <p className="text-sm text-red-400 text-center py-4">解析に失敗しました</p>
          )}
        </div>
      </div>
    </div>
  );
}

type VideosContainerProps = {
  initialVideos: Video[];
};

export function VideosContainer({ initialVideos }: VideosContainerProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasIncomplete = videos.some(
      (v) => v.analysis_status === "pending" || v.analysis_status === "analyzing"
    );

    if (hasIncomplete && !pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) {
          setVideos(data as Video[]);
          setSelectedVideo((prev) =>
            prev ? (data.find((v) => v.id === prev.id) as Video | null) ?? null : null
          );
        }
      }, 8000);
    }

    if (!hasIncomplete && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [videos]);

  const handleRegistered = (videoId: string) => {
    setShowRegisterModal(false);
    // 新しいvideoをpendingとして追加（実際にはリロードが確実だがUX向上のため仮追加）
    // 解析完了後はページリロードで反映される
    window.location.reload();
    void videoId;
  };

  const handleDelete = async (videoId: string) => {
    const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      setSelectedVideo((prev) => (prev?.id === videoId ? null : prev));
    }
  };

  const handleRetry = (videoId: string) => {
    // 状態をanalyzingに更新してから再解析
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, analysis_status: "analyzing" as VideoAnalysisStatus }
          : v
      )
    );
    fetch("/api/videos/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId }),
    }).catch(console.error);
  };

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
        {/* Hero */}
        <section className="pt-12 pb-8 px-8">
          <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
            [06] Videos
          </span>
          <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
            動画ライブラリ
          </h1>
          <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
            登録済み: {videos.length}本
          </p>
        </section>

        {/* Content */}
        <section className="px-8 pb-20">
          <div className="flex justify-end mb-6">
            <Button onClick={() => setShowRegisterModal(true)}>
              ＋ 動画を登録
            </Button>
          </div>

          {videos.length > 0 ? (
            <div className="space-y-2">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={setSelectedVideo}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-[var(--text-secondary)] mb-2">まだ動画が登録されていません</p>
              <p className="text-sm text-[var(--text-tertiary)] mb-6">
                YouTube動画の文字起こしを登録して、スキルツリーにマッピングしましょう
              </p>
              <Button onClick={() => setShowRegisterModal(true)}>
                ＋ 最初の動画を登録
              </Button>
            </div>
          )}
        </section>
      </div>

      {showRegisterModal && (
        <VideoRegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegistered={handleRegistered}
        />
      )}

      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}
