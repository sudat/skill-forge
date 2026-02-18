"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Goal } from "@/types/database";
import { DeleteConfirmModal } from "@/components/goal/delete-confirm-modal";

type GoalWithNodeCount = Goal & { nodeCount: number };

type GoalListClientProps = {
  goals: GoalWithNodeCount[];
};

export function GoalListClient({ goals: initialGoals }: GoalListClientProps) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoalWithNodeCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleStatus = async (goal: GoalWithNodeCount) => {
    const newStatus = goal.status === "active" ? "archived" : "active";
    setLoadingId(goal.id);

    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setGoals((prev) =>
        prev.map((g) => {
          if (newStatus === "active") {
            // 他のゴールをアーカイブ、対象をアクティブに
            return g.id === goal.id
              ? { ...g, status: "active" }
              : { ...g, status: "archived" };
          }
          return g.id === goal.id ? { ...g, status: "archived" } : g;
        })
      );

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/goals/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete goal");
      }

      setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const archivedGoals = goals.filter((g) => g.status === "archived");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-gray-100 mb-1">ゴール管理</h1>
          <p className="text-sm text-gray-500">学習ゴールの一覧と切り替え</p>
        </div>
        <Link
          href="/goal/new"
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm hover:opacity-90 transition-opacity"
        >
          + 新しいゴールを作成
        </Link>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-400 mb-6">まだゴールが登録されていません</p>
          <Link
            href="/goal/new"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
          >
            最初のゴールを作成する
          </Link>
        </div>
      )}

      {activeGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            アクティブ
          </h2>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isLoading={loadingId === goal.id}
                onToggle={toggleStatus}
              />
            ))}
          </div>
        </section>
      )}

      {archivedGoals.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            アーカイブ
          </h2>
          <div className="space-y-3">
            {archivedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isLoading={loadingId === goal.id}
                onToggle={toggleStatus}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <DeleteConfirmModal
          goalTitle={deleteTarget.title}
          nodeCount={deleteTarget.nodeCount}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

function GoalCard({
  goal,
  isLoading,
  onToggle,
  onDelete,
}: {
  goal: GoalWithNodeCount;
  isLoading: boolean;
  onToggle: (goal: GoalWithNodeCount) => void;
  onDelete?: (goal: GoalWithNodeCount) => void;
}) {
  const isActive = goal.status === "active";
  const createdAt = new Date(goal.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
        isActive
          ? "bg-purple-500/[0.06] border-purple-500/30"
          : "bg-white/[0.02] border-white/[0.06] opacity-60 hover:opacity-80"
      }`}
    >
      {/* Status dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          isActive ? "bg-purple-400" : "bg-gray-600"
        }`}
      />

      {/* Main content */}
      <Link href={`/goal/${goal.id}`} className="flex-1 min-w-0">
        <div className="text-[14px] text-gray-200 truncate">{goal.title}</div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-gray-500">{createdAt}</span>
          {goal.nodeCount > 0 && (
            <span className="text-[11px] text-gray-500">
              {goal.nodeCount} ノード
            </span>
          )}
          {goal.nodeCount === 0 && (
            <span className="text-[11px] text-gray-600">ツリー未生成</span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/goal/${goal.id}?tab=chat`}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-gray-200 transition-colors"
        >
          チャット
        </Link>
        <button
          type="button"
          onClick={() => onToggle(goal)}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
            isActive
              ? "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-gray-200"
              : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? "..." : isActive ? "アーカイブ" : "アクティブにする"}
        </button>
        {!isActive && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(goal)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
}
