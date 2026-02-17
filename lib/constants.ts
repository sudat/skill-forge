import type { SkillNodeStatus } from "@/types/database";

export type StatusConfig = {
  color: string;
  glow: string;
  label: string;
  icon: string;
  bgOpacity: string;
};

export const STATUS_CONFIG: Record<SkillNodeStatus, StatusConfig> = {
  mastered: {
    color: "#22c55e",
    glow: "0 0 20px rgba(34,197,94,0.4)",
    label: "習得済み",
    icon: "★",
    bgOpacity: "22",
  },
  learned: {
    color: "#3b82f6",
    glow: "0 0 20px rgba(59,130,246,0.4)",
    label: "学習中",
    icon: "◆",
    bgOpacity: "22",
  },
  in_progress: {
    color: "#f59e0b",
    glow: "0 0 20px rgba(245,158,11,0.4)",
    label: "着手中",
    icon: "▶",
    bgOpacity: "22",
  },
  available: {
    color: "#8b5cf6",
    glow: "0 0 15px rgba(139,92,246,0.3)",
    label: "解放済み",
    icon: "○",
    bgOpacity: "18",
  },
  locked: {
    color: "#4b5563",
    glow: "none",
    label: "未解放",
    icon: "🔒",
    bgOpacity: "10",
  },
};

export const NAV_ITEMS = [
  { id: "dashboard", href: "/", label: "ダッシュボード", icon: "📊" },
  { id: "goal", href: "/goal", label: "ゴール設定", icon: "🎯" },
  { id: "tree", href: "/tree", label: "スキルツリー", icon: "🌳" },
  { id: "videos", href: "/videos", label: "動画ライブラリ", icon: "📹" },
  { id: "gap", href: "/gap", label: "ギャップ分析", icon: "🔍" },
] as const;
