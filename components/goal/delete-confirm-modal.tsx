"use client";

import { useRef } from "react";

type DeleteConfirmModalProps = {
  goalTitle: string;
  nodeCount: number;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmModal({
  goalTitle,
  nodeCount,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteConfirmModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current && !isDeleting) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[15px] text-gray-200">ゴールを削除</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          {/* 警告メッセージ */}
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            この操作は取り消せません
          </div>

          {/* 削除対象 */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">以下のゴールを完全に削除します：</p>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
              <div className="text-[14px] text-gray-200 truncate">{goalTitle}</div>
              {nodeCount > 0 && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {nodeCount} 件のスキルノードも削除されます
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2 rounded-lg text-[13px] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-all disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-5 py-2 rounded-lg text-[13px] transition-all ${
              isDeleting
                ? "bg-red-500/30 text-red-300/50 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );
}
