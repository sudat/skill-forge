"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
              SkillForge
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-1 tracking-widest">
              YOUR LEARNING, YOUR TREE
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5
                transition-all duration-200 text-[13px]
                ${
                  isActive
                    ? "bg-[var(--accent-primary)]/[0.12] border-l-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium"
                    : "border-l-2 border-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]"
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Weekly stats */}
      <div className="px-3 pb-4">
        <div className="p-3.5 bg-[var(--accent-tertiary)]/[0.06] rounded-xl border border-[var(--accent-tertiary)]/[0.12]">
          <div className="text-[11px] text-[var(--text-tertiary)] mb-1.5">
            今週の学習
          </div>
          <div className="text-xl font-bold text-[var(--accent-tertiary)] font-mono">
            0<span className="text-xs text-[var(--text-tertiary)]">時間</span>
            <span className="text-xs text-[var(--text-tertiary)] ml-1">0</span>
            <span className="text-xs text-[var(--text-tertiary)]">分</span>
          </div>
          <div className="h-1 bg-[var(--bg-tertiary)] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[var(--accent-tertiary)] rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
            週間目標: 7時間
          </div>
        </div>
      </div>
    </aside>
  );
}
