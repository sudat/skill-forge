import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

/**
 * 基本カードコンポーネント
 * Attio Aesthetic: translateY + shadow hover (NO scale!)
 */
export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-6
        bg-[var(--bg-card)]
        rounded-2xl
        border border-[var(--border-subtle)]
        ${hover ? "hover:border-[var(--border-default)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all transition-shadow duration-[250ms] transition-transform duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h2 className={`text-[15px] text-[var(--text-primary)] ${className}`}>
      {children}
    </h2>
  );
}

type CardContentProps = {
  children: ReactNode;
  className?: string;
};

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--border-subtle)] ${className}`}>
      {children}
    </div>
  );
}

/**
 * Bentoグリッド用カード
 * Attio Aesthetic: translateY + shadow (NO scale!)
 */
export function BentoCard({
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-6
        bg-[var(--bg-card)]
        rounded-2xl
        border border-[var(--border-subtle)]
        hover:border-[var(--border-default)]
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        hover:-translate-y-0.5
        transition-all
        transition-shadow duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]
        transition-transform duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * 統計表示用カード
 * Attio Aesthetic: translateY + shadow hover (NO scale!)
 */
type StatCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  color?: "purple" | "blue" | "green" | "red" | "yellow";
  className?: string;
};

const statColors = {
  purple: "text-[var(--accent-primary)]",
  blue: "text-[var(--accent-secondary)]",
  green: "text-[var(--accent-tertiary)]",
  red: "text-red-400",
  yellow: "text-yellow-400",
};

export function StatCard({
  label,
  value,
  unit,
  color = "purple",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`
        p-5
        bg-[var(--bg-card)]
        rounded-xl
        border border-[var(--border-subtle)]
        hover:border-[var(--border-default)]
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        hover:-translate-y-0.5
        transition-all
        transition-shadow duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]
        transition-transform duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]
        ${className}
      `}
    >
      <div className="text-xs text-[var(--text-tertiary)] mb-2 tracking-wide">{label}</div>
      <div className={`text-3xl font-mono font-bold tracking-tight ${statColors[color]}`}>
        {value}
        {unit && (
          <span className="text-sm text-[var(--text-tertiary)] ml-1 font-normal">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
