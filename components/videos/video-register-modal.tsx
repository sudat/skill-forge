"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type VideoRegisterModalProps = {
  onClose: () => void;
  onRegistered: (videoId: string) => void;
};

export function VideoRegisterModal({
  onClose,
  onRegistered,
}: VideoRegisterModalProps) {
  const [form, setForm] = useState({
    title: "",
    url: "",
    channel_name: "",
    duration: "",
    transcript: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.transcript.trim()) {
      setError("タイトルと文字起こしは必須です");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // videosテーブルにinsert
      const { data: video, error: insertError } = await supabase
        .from("videos")
        .insert({
          title: form.title.trim(),
          url: form.url.trim() || null,
          channel_name: form.channel_name.trim() || null,
          duration: form.duration.trim() || null,
          transcript: form.transcript.trim(),
          analysis_status: "pending",
        })
        .select()
        .single();

      if (insertError || !video) {
        throw new Error(insertError?.message ?? "動画の保存に失敗しました");
      }

      // AI解析APIを非同期で呼び出し（awaitしない）
      fetch("/api/videos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: video.id }),
      }).catch(console.error);

      onRegistered(video.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[15px] text-gray-200">動画を登録</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all"
          >
            ✕
          </button>
        </div>

        {/* フォーム */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* タイトル */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              タイトル <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="動画タイトルを入力"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              URL（任意）
            </label>
            <input
              name="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>

          {/* チャンネル名 + 再生時間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                チャンネル名（任意）
              </label>
              <input
                name="channel_name"
                value={form.channel_name}
                onChange={handleChange}
                placeholder="例：プログラミング学習"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                再生時間（任意）
              </label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="例：1:30:00"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
          </div>

          {/* 文字起こし */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              文字起こし <span className="text-red-400">*</span>
            </label>
            <textarea
              name="transcript"
              value={form.transcript}
              onChange={handleChange}
              placeholder="YouTubeの文字起こしをここにペーストしてください..."
              rows={8}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors resize-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-600 mt-1">
              YouTubeの「文字起こし」機能からコピーしてください
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-[13px] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-lg text-[13px] transition-all ${
              isSubmitting
                ? "bg-white/[0.06] text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
            }`}
          >
            {isSubmitting ? "登録中..." : "登録してAI解析"}
          </button>
        </div>
      </div>
    </div>
  );
}
