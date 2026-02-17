export default function GapPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl text-gray-100 mb-1">ギャップ分析</h1>
      <p className="text-[13px] text-gray-500 mb-7">
        ゴールに対する未カバー領域
      </p>

      <div className="text-center py-16">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-400 mb-2">
          ギャップ分析にはゴールと動画の登録が必要です
        </p>
        <p className="text-sm text-gray-600">
          スキルツリーの生成と動画の登録を先に完了してください
        </p>
      </div>
    </div>
  );
}
