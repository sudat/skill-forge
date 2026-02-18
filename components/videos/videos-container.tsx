"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { VideoCard } from "./video-card";
import { VideoRegisterModal } from "./video-register-modal";
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
      <div className="w-full max-w-xl bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <h2 className="text-[15px] text-gray-200 truncate flex-1 mr-4">{video.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* メタ情報 */}
          <div className="flex gap-3 flex-wrap text-xs text-gray-500">
            {video.channel_name && <span>📺 {video.channel_name}</span>}
            {video.duration && <span>⏱ {video.duration}</span>}
            {video.url && (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                動画を開く →
              </a>
            )}
          </div>

          {/* サマリー */}
          {video.summary && (
            <div>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">サマリー</h3>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
                <p className="text-sm text-gray-300 leading-relaxed">{video.summary}</p>
              </div>
            </div>
          )}

          {/* キーポイント */}
          {keyPoints.length > 0 && (
            <div>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                キーポイント ({keyPoints.length})
              </h3>
              <div className="space-y-2">
                {keyPoints.map((kp, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                  >
                    <span className="text-purple-400 shrink-0 text-sm">◆</span>
                    <div>
                      <div className="text-[13px] text-gray-200">{kp.topic}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{kp.description}</div>
                      {kp.timestamp && (
                        <div className="text-[10px] text-gray-600 mt-0.5">{kp.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 解析状態メッセージ */}
          {video.analysis_status === "pending" && (
            <p className="text-sm text-gray-500 text-center py-4">解析待機中...</p>
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl text-gray-100 mb-1">動画ライブラリ</h1>
            <p className="text-[13px] text-gray-500">登録済み: {videos.length}本</p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[13px] hover:opacity-90 transition-opacity"
          >
            ＋ 動画を登録
          </button>
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
            <p className="text-gray-400 mb-2">まだ動画が登録されていません</p>
            <p className="text-sm text-gray-600 mb-6">
              YouTube動画の文字起こしを登録して、スキルツリーにマッピングしましょう
            </p>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm hover:opacity-90 transition-opacity"
            >
              ＋ 最初の動画を登録
            </button>
          </div>
        )}
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
