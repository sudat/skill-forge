import { createClient } from "@/lib/supabase/server";

export default async function VideosPage() {
  const supabase = await createClient();

  const { data: videos, count } = await supabase
    .from("videos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl text-gray-100 mb-1">動画ライブラリ</h1>
          <p className="text-[13px] text-gray-500">
            登録済み: {count ?? 0}本
          </p>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[13px] cursor-not-allowed opacity-50">
          ＋ 動画を登録
        </button>
      </div>

      {videos && videos.length > 0 ? (
        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <div className="w-20 h-[52px] rounded-lg bg-white/[0.06] flex items-center justify-center text-2xl shrink-0">
                ▶
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200">{video.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {video.channel_name} · {video.duration}
                </div>
              </div>
              <div
                className={`text-[11px] px-2.5 py-1 rounded-md shrink-0 ${
                  video.analysis_status === "completed"
                    ? "text-green-500 bg-green-500/10"
                    : video.analysis_status === "analyzing"
                      ? "text-yellow-500 bg-yellow-500/10"
                      : "text-gray-500 bg-white/[0.06]"
                }`}
              >
                {video.analysis_status === "completed"
                  ? "解析済み"
                  : video.analysis_status === "analyzing"
                    ? "解析中..."
                    : "未解析"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📹</div>
          <p className="text-gray-400 mb-2">まだ動画が登録されていません</p>
          <p className="text-sm text-gray-600">
            YouTube動画の文字起こしを登録して、スキルツリーにマッピングしましょう
          </p>
        </div>
      )}
    </div>
  );
}
