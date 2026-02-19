import { ReactNode } from "react";

type BadgeVariant = "default" | "purple" | "blue" | "green" | "yellow" | "red";
type BadgeSize = "sm" | "md";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-[var(--bg-tertiary)]
    text-[var(--text-secondary)]
    border border-[var(--border-subtle)]
  `,
  purple: `
    bg-[var(--accent-primary)]/15
    text-[var(--accent-primary)]
    border border-[var(--accent-primary)]/30
  `,
  blue: `
    bg-[var(--accent-secondary)]/15
    text-[var(--accent-secondary)]
    border border-[var(--accent-secondary)]/30
  `,
  green: `
    bg-[var(--accent-tertiary)]/15
    text-[var(--accent-tertiary)]
    border border-[var(--accent-tertiary)]/30
  `,
  yellow: `
    bg-yellow-500/15
    text-yellow-400
    border border-yellow-500/30
  `,
  red: `
    bg-red-500/15
    text-red-400
    border border-red-500/30
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

/**
 * 汎用バッジコンポーネント
 * ステータス表示やラベルに使用
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full
        font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * ステータスバッジ
 * スキルノードのステータス表示用
 */
type StatusBadgeProps = {
  status: "mastered" | "learned" | "in_progress" | "available" | "locked";
  label?: string;
  icon?: string;
  className?: string;
};

const statusConfig = {
  mastered: {
    variant: "green" as const,
    defaultLabel: "習得済み",
    defaultIcon: "★",
  },
  learned: {
    variant: "blue" as const,
    defaultLabel: "学習中",
    defaultIcon: "◆",
  },
  in_progress: {
    variant: "yellow" as const,
    defaultLabel: "着手中",
    defaultIcon: "▶",
  },
  available: {
    variant: "purple" as const,
    defaultLabel: "解放済み",
    defaultIcon: "○",
  },
  locked: {
    variant: "default" as const,
    defaultLabel: "未解放",
    defaultIcon: "🔒",
  },
};

export function StatusBadge({
  status,
  label,
  icon,
  className = "",
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {icon ?? config.defaultIcon}
      <span>{label ?? config.defaultLabel}</span>
    </Badge>
  );
}

/**
 * ドットバッジ
 * 小さなステータスインジケーター
 */
type DotBadgeProps = {
  color: "purple" | "blue" | "green" | "yellow" | "red" | "gray";
  className?: string;
};

const dotColors = {
  purple: "bg-[var(--accent-primary)]",
  blue: "bg-[var(--accent-secondary)]",
  green: "bg-[var(--accent-tertiary)]",
  yellow: "bg-yellow-400",
  red: "bg-red-400",
  gray: "bg-gray-400",
};

export function DotBadge({ color, className = "" }: DotBadgeProps) {
  return (
    <span
      className={`
        inline-block w-2 h-2 rounded-full
        ${dotColors[color]}
        ${className}
      `}
    />
  );
}
