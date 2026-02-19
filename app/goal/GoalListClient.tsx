"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Goal } from "@/types/database";
import { DeleteConfirmModal } from "@/components/goal/delete-confirm-modal";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
      {/* Hero */}
      <section className="pt-12 pb-8 px-8">
        <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
          [04] Goals
        </span>
        <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
          ゴール管理
        </h1>
        <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
          学習ゴールの一覧と切り替え
        </p>
      </section>

      {/* Content */}
      <section className="px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-end mb-8">
            <Button>
              <Link href="/goal/new">+ 新しいゴールを作成</Link>
            </Button>
          </div>

          {goals.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-[var(--text-secondary)] mb-6">まだゴールが登録されていません</p>
              <Button>
                <Link href="/goal/new">最初のゴールを作成する</Link>
              </Button>
            </div>
          )}

          {activeGoals.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
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
              <h2 className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
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
        </div>
      </section>

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
      className={`flex items-center gap-4 p-4 rounded-xl border card-hover-lift ${
        isActive
          ? "bg-[var(--accent-primary)]/[0.06] border-[var(--accent-primary)]/30"
          : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] opacity-60 hover:opacity-80"
      }`}
    >
      {/* Status dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          isActive ? "bg-[var(--accent-primary)]" : "bg-[var(--text-tertiary)]"
        }`}
      />

      {/* Main content */}
      <Link href={`/goal/${goal.id}`} className="flex-1 min-w-0">
        <div className="text-[14px] text-[var(--text-primary)] truncate">{goal.title}</div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-[var(--text-tertiary)]">{createdAt}</span>
          {goal.nodeCount > 0 && (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {goal.nodeCount} ノード
            </span>
          )}
          {goal.nodeCount === 0 && (
            <span className="text-[11px] text-[var(--text-tertiary)]">ツリー未生成</span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/goal/${goal.id}?tab=chat`}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          チャット
        </Link>
        <button
          type="button"
          onClick={() => onToggle(goal)}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all duration-200 ${
            isActive
              ? "bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              : "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? "..." : isActive ? "アーカイブ" : "アクティブにする"}
        </button>
        {!isActive && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(goal)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-[12px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
}
