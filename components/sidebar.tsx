"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[#0f1118] border-r border-white/[0.06] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
          SkillForge
        </div>
        <div className="text-[10px] text-gray-600 mt-1 tracking-widest">
          YOUR LEARNING, YOUR TREE
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
                    ? "bg-purple-500/[0.12] border-l-2 border-purple-500 text-purple-300 font-medium"
                    : "border-l-2 border-transparent text-gray-500 hover:bg-white/[0.03]"
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
        <div className="p-3.5 bg-green-500/[0.06] rounded-xl border border-green-500/[0.12]">
          <div className="text-[11px] text-gray-500 mb-1.5">今週の学習</div>
          <div className="text-xl font-bold text-green-500 font-mono">
            0<span className="text-xs text-gray-500">時間</span>
            <span className="text-xs text-gray-500 ml-1">0</span>
            <span className="text-xs text-gray-500">分</span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">週間目標: 7時間</div>
        </div>
      </div>
    </aside>
  );
}
