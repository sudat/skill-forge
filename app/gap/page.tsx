import { createClient } from "@/lib/supabase/server";
import type { SkillNode, SkillNodeStatus, OverlappingTopic } from "@/types/database";

function getCoverageColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  if (score > 0) return "#ef4444";
  return "#4b5563";
}

function getCoverageLabel(score: number): string {
  if (score >= 70) return "高";
  if (score >= 40) return "中";
  if (score > 0) return "低";
  return "未";
}

export default async function GapPage() {
  const supabase = await createClient();

  // アクティブゴールを取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = goals?.[0];

  if (!activeGoal) {
    return (
      <div className="p-8">
        <h1 className="text-2xl text-gray-100 mb-1">ギャップ分析</h1>
        <p className="text-[13px] text-gray-500 mb-7">ゴールに対する未カバー領域</p>
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400 mb-4">まずゴールを設定してください</p>
          <a
            href="/goal"
            className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
          >
            🎯 ゴールを設定する
          </a>
        </div>
      </div>
    );
  }

  // スキルノードを取得
  const { data: nodes } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("goal_id", activeGoal.id)
    .order("depth")
    .order("sort_order");

  const allNodes = (nodes ?? []) as SkillNode[];

  if (allNodes.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl text-gray-100 mb-1">ギャップ分析</h1>
        <p className="text-[13px] text-gray-500 mb-7">ゴールに対する未カバー領域</p>
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🌱</div>
          <p className="text-gray-400 mb-4">スキルツリーがまだ生成されていません</p>
          <a
            href="/goal"
            className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
          >
            🎯 ゴール設定AIで対話する
          </a>
        </div>
      </div>
    );
  }

  // 統計計算
  const totalNodes = allNodes.length;
  const coveredNodes = allNodes.filter((n) => n.coverage_score > 0).length;
  const coverageRate = Math.round((coveredNodes / totalNodes) * 100);
  const uncoveredNodes = allNodes.filter((n) => n.coverage_score === 0);
  const availableUncovered = uncoveredNodes.filter(
    (n) => (n.status as SkillNodeStatus) === "available"
  );

  // ステータス別カウント
  const statusCounts: Record<string, number> = {};
  for (const node of allNodes) {
    statusCounts[node.status] = (statusCounts[node.status] ?? 0) + 1;
  }

  // 動画重複データを取得
  const { data: overlaps } = await supabase
    .from("video_overlaps")
    .select(`
      *,
      video_a:videos!video_overlaps_video_a_id_fkey(id, title),
      video_b:videos!video_overlaps_video_b_id_fkey(id, title)
    `)
    .order("overlap_score", { ascending: false });

  const allOverlaps = overlaps ?? [];

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl text-gray-100 mb-1">ギャップ分析</h1>
      <p className="text-[13px] text-gray-500 mb-7">
        「{activeGoal.title}」のカバレッジ
      </p>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="text-xs text-gray-500 mb-2">全体カバレッジ</div>
          <div className="text-3xl font-mono font-bold text-green-400">
            {coverageRate}
            <span className="text-sm text-gray-500 ml-1">%</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${coverageRate}%` }}
            />
          </div>
        </div>
        <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="text-xs text-gray-500 mb-2">未カバーノード</div>
          <div className="text-3xl font-mono font-bold text-red-400">
            {uncoveredNodes.length}
            <span className="text-sm text-gray-500 ml-1">個</span>
          </div>
          <div className="text-xs text-gray-600 mt-2">全{totalNodes}ノード中</div>
        </div>
        <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="text-xs text-gray-500 mb-2">次に学べるスキル</div>
          <div className="text-3xl font-mono font-bold text-purple-400">
            {availableUncovered.length}
            <span className="text-sm text-gray-500 ml-1">個</span>
          </div>
          <div className="text-xs text-gray-600 mt-2">解放済みの未カバーノード</div>
        </div>
      </div>

      {/* カバレッジヒートマップ */}
      <div className="mb-8">
        <h2 className="text-[15px] text-gray-200 mb-4">カバレッジヒートマップ</h2>
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
          <div className="flex flex-wrap gap-1.5">
            {allNodes.map((node) => {
              const color = getCoverageColor(node.coverage_score);
              const label = getCoverageLabel(node.coverage_score);
              const indent = node.depth * 16;
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all hover:opacity-80"
                  style={{
                    borderColor: `${color}40`,
                    backgroundColor: `${color}15`,
                    marginLeft: node.depth > 0 ? `${indent}px` : undefined,
                    color,
                  }}
                  title={`${node.label}: ${node.coverage_score}%`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {node.label}
                  <span className="opacity-60">{label}</span>
                </div>
              );
            })}
          </div>
          {/* 凡例 */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-[11px] text-gray-600">カバレッジ:</span>
            {[
              { label: "高 (70%+)", color: "#22c55e" },
              { label: "中 (40-70%)", color: "#f59e0b" },
              { label: "低 (1-40%)", color: "#ef4444" },
              { label: "未 (0%)", color: "#4b5563" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1 text-[11px]" style={{ color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 次のステップ提案 */}
      {availableUncovered.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[15px] text-gray-200 mb-4">
            次に学ぶべきスキル（TOP {Math.min(3, availableUncovered.length)}）
          </h2>
          <div className="space-y-2">
            {availableUncovered.slice(0, 3).map((node, i) => (
              <div
                key={node.id}
                className="flex items-start gap-3 p-4 bg-white/[0.03] rounded-xl border border-purple-500/20"
              >
                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm text-gray-200 mb-1">{node.label}</div>
                  {node.knowledge_text && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {node.knowledge_text.slice(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未カバーノード一覧 */}
      <div className="mb-8">
        <h2 className="text-[15px] text-gray-200 mb-4">
          未カバーノード一覧 ({uncoveredNodes.length}個)
        </h2>
        {uncoveredNodes.length === 0 ? (
          <p className="text-sm text-gray-500">
            全てのノードが動画でカバーされています！
          </p>
        ) : (
          <div className="space-y-2">
            {uncoveredNodes.map((node) => {
              const status = node.status as SkillNodeStatus;
              const isLocked = status === "locked";
              return (
                <div
                  key={node.id}
                  className={`flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] ${
                    isLocked ? "opacity-40" : ""
                  }`}
                >
                  <span className="text-sm text-red-400 shrink-0 mt-0.5">✕</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-200">{node.label}</span>
                      {isLocked && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] text-gray-500 rounded">
                          未解放
                        </span>
                      )}
                    </div>
                    {node.knowledge_text && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {node.knowledge_text.slice(0, 120)}
                        {node.knowledge_text.length > 120 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 動画重複分析 */}
      <div>
        <h2 className="text-[15px] text-gray-200 mb-4">
          動画重複分析 ({allOverlaps.length}ペア)
        </h2>
        {allOverlaps.length === 0 ? (
          <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <p className="text-sm text-gray-500">
              動画が2本以上登録されると、重複分析が表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allOverlaps.map((overlap) => {
              const videoA = (overlap as unknown as { video_a: { title: string } }).video_a;
              const videoB = (overlap as unknown as { video_b: { title: string } }).video_b;
              const score = overlap.overlap_score;
              const isHighOverlap = score >= 60;
              const overlapColor = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";
              const topics = (overlap.overlapping_topics as OverlappingTopic[] | null) ?? [];

              return (
                <div
                  key={overlap.id}
                  className={`p-4 rounded-xl border ${
                    isHighOverlap
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-gray-300 mb-1 truncate">
                        {videoA?.title ?? "動画A"}
                      </div>
                      <div className="text-xs text-gray-600">vs</div>
                      <div className="text-[13px] text-gray-300 mt-1 truncate">
                        {videoB?.title ?? "動画B"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className="text-2xl font-mono font-bold"
                        style={{ color: overlapColor }}
                      >
                        {score}%
                      </div>
                      <div className="text-[10px] text-gray-600">重複度</div>
                    </div>
                  </div>

                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {topics.slice(0, 5).map((t, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 bg-white/[0.06] text-gray-400 rounded"
                        >
                          {t.topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {overlap.recommendation && (
                    <div className="text-xs text-gray-400 bg-white/[0.04] rounded-lg p-3 leading-relaxed">
                      💡 {overlap.recommendation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
