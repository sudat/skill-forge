import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--accent-primary)] text-white font-medium
    hover:bg-[var(--accent-primary)]/90
    hover:shadow-lg hover:shadow-purple-500/25
    active:scale-[0.98]
  `,
  secondary: `
    bg-[var(--bg-secondary)] text-[var(--text-primary)]
    border border-[var(--border-default)]
    hover:bg-[var(--bg-tertiary)]
    hover:border-[var(--border-accent)]
    active:scale-[0.98]
  `,
  ghost: `
    bg-transparent text-[var(--text-secondary)]
    hover:bg-[var(--bg-secondary)]
    hover:text-[var(--text-primary)]
  `,
  danger: `
    bg-red-500 text-white font-medium
    hover:bg-red-600
    hover:shadow-lg hover:shadow-red-500/25
    active:scale-[0.98]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

/**
 * 汎用ボタンコンポーネント
 * Primary（パープル）、Secondary（アウトライン）、Ghost（透明）、Danger（赤）
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * アイコンボタン
 */
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${iconSizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * リンク風ボタン
 */
type LinkButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function LinkButton({
  children,
  href,
  variant = "primary",
  className = "",
}: LinkButtonProps) {
  const linkStyles =
    variant === "primary"
      ? "text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
      : "text-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]/80";

  return (
    <a
      href={href}
      className={`
        text-xs
        transition-colors duration-200
        ${linkStyles}
        ${className}
      `}
    >
      {children}
    </a>
  );
}
