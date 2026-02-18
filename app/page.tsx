import { createClient } from "@/lib/supabase/server";
import { STATUS_CONFIG } from "@/lib/constants";
import { countByStatus, buildTree } from "@/lib/skill-tree";
import type { SkillNodeStatus, Video } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  // アクティブなゴールを取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = goals?.[0];

  // スキルノードを取得
  const { data: nodes } = activeGoal
    ? await supabase
        .from("skill_nodes")
        .select("*")
        .eq("goal_id", activeGoal.id)
        .order("sort_order")
    : { data: [] };

  const allNodes = nodes ?? [];
  const tree = buildTree(allNodes);
  const { counts: statusCount } = countByStatus(tree);

  // カバレッジ率を計算（coverage_score > 0 のノード数 / 全ノード数）
  const coveredCount = allNodes.filter((n) => n.coverage_score > 0).length;
  const masteryRate =
    allNodes.length > 0
      ? Math.round((coveredCount / allNodes.length) * 100)
      : 0;

  const uncoveredCount = allNodes.filter((n) => n.coverage_score === 0).length;

  // 最近の動画を取得
  const { data: recentVideos } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  const { count: videoCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true });

  // 最近のAI対話履歴
  const { data: recentConversations } = activeGoal
    ? await supabase
        .from("goal_conversations")
        .select("*")
        .eq("goal_id", activeGoal.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const orderedConversations = [...(recentConversations ?? [])].reverse();

  return (
    <div className="p-8">
      <h1 className="text-2xl text-gray-100 mb-2">ダッシュボード</h1>
      <p className="text-sm text-gray-500 mb-7">あなたの学習の全体像</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "登録動画",
            value: videoCount ?? 0,
            unit: "本",
            color: "text-blue-400",
          },
          {
            label: "スキルノード",
            value: allNodes.length,
            unit: "個",
            color: "text-purple-400",
          },
          {
            label: "カバレッジ率",
            value: masteryRate,
            unit: "%",
            color: "text-green-400",
          },
          {
            label: "未カバー領域",
            value: uncoveredCount,
            unit: "個",
            color: "text-red-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.06]"
          >
            <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
            <div className={`text-3xl font-mono font-bold ${stat.color}`}>
              {stat.value}
              <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* アクティブゴール */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
          <h2 className="text-[15px] text-gray-200 mb-4">現在のゴール</h2>
          {activeGoal ? (
            <div>
              <div className="text-lg text-gray-100 mb-2">{activeGoal.title}</div>
              {activeGoal.description && (
                <p className="text-sm text-gray-400 mb-4">{activeGoal.description}</p>
              )}
              {/* ステータス別内訳 */}
              {allNodes.length > 0 && (
                <div className="space-y-2">
                  {(Object.keys(STATUS_CONFIG) as SkillNodeStatus[]).map(
                    (status) => {
                      const count = statusCount[status] ?? 0;
                      if (count === 0) return null;
                      const config = STATUS_CONFIG[status];
                      return (
                        <div key={status} className="flex items-center gap-2">
                          <span
                            className="text-xs w-4"
                            style={{ color: config.color }}
                          >
                            {config.icon}
                          </span>
                          <span className="text-xs text-gray-400 flex-1">
                            {config.label}
                          </span>
                          <span
                            className="text-xs font-mono"
                            style={{ color: config.color }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <a
                  href={`/goal/${activeGoal.id}?tab=chat`}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  対話を続ける →
                </a>
                <span className="text-xs text-gray-700">|</span>
                <a
                  href="/tree"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ツリーを見る →
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">まだゴールが設定されていません</p>
              <a
                href="/goal"
                className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
              >
                🎯 ゴールを設定する
              </a>
            </div>
          )}
        </div>

        {/* 最近登録した動画 */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] text-gray-200">最近の動画</h2>
            <a
              href="/videos"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              全て見る →
            </a>
          </div>
          {recentVideos && recentVideos.length > 0 ? (
            <div className="space-y-3">
              {(recentVideos as Video[]).map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm shrink-0">
                    ▶
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-200 truncate">
                      {video.title}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {video.analysis_status === "completed"
                        ? "解析済み"
                        : video.analysis_status === "analyzing"
                          ? "解析中..."
                          : "未解析"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">まだ動画がありません</p>
              <a
                href="/videos"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                動画を登録する →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 最近のAI対話 */}
      {orderedConversations.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] text-gray-200">最近のAI対話</h2>
            <a
              href={activeGoal ? `/goal/${activeGoal.id}?tab=chat` : "/goal"}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              対話ページへ →
            </a>
          </div>
          <div className="space-y-3">
            {orderedConversations.map((conv) => (
              <div key={conv.id} className="flex gap-3 items-start">
                <span className="text-xs shrink-0 mt-0.5">
                  {conv.role === "user" ? "👤" : "🤖"}
                </span>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                  {conv.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
