"use client";

import { useState } from "react";

type Settings = {
  llm_provider: "zai" | "openai";
  openai_api_key_masked: string;
  openai_model: string;
};

const OPENAI_MODELS = [
  { value: "gpt-5.2", label: "GPT-5.2（最新・汎用）" },
  { value: "gpt-5.2-pro", label: "GPT-5.2 Pro（最高精度）" },
  { value: "gpt-5-mini", label: "GPT-5 mini（コスト最適）" },
];

export function SettingsClient({ initial }: { initial: Settings }) {
  const [provider, setProvider] = useState<"zai" | "openai">(initial.llm_provider);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(
    initial.openai_model || "gpt-4o-mini",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    if (provider === "openai" && !openaiKey && !initial.openai_api_key_masked) {
      setError("OpenAI を使用するには API キーを入力してください。");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llm_provider: provider,
          openai_api_key: openaiKey,
          openai_model: openaiModel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      setSaved(true);
      setOpenaiKey("");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* LLM プロバイダー選択 */}
      <section className="bg-[#0f1118] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-[13px] font-semibold text-gray-300 mb-4 tracking-wide uppercase">
          LLM プロバイダー
        </h2>

        <div className="flex gap-3">
          {(["zai", "openai"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`
                flex-1 py-3 px-4 rounded-lg border text-[13px] font-medium
                transition-all duration-200 text-left
                ${
                  provider === p
                    ? "border-purple-500/60 bg-purple-500/[0.12] text-purple-300"
                    : "border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/[0.14] hover:text-gray-400"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${provider === p ? "bg-purple-400" : "bg-gray-700"}`}
                />
                {p === "zai" ? "Z.AI" : "OpenAI"}
              </div>
              <div className="text-[11px] text-gray-600 mt-1 ml-4">
                {p === "zai" ? "GLM-4.7 / json_object + リトライ" : "GPT-4o / json_schema 保証"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Z.AI 設定（参照のみ） */}
      {provider === "zai" && (
        <section className="bg-[#0f1118] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-[13px] font-semibold text-gray-300 mb-4 tracking-wide uppercase">
            Z.AI 設定
          </h2>
          <div className="flex items-center gap-3 p-3.5 bg-green-500/[0.06] border border-green-500/[0.14] rounded-lg">
            <span className="text-green-400 text-base">✓</span>
            <div>
              <p className="text-[13px] text-gray-300">
                API キーは <code className="text-green-400 text-[12px] bg-green-500/[0.1] px-1.5 py-0.5 rounded">ZAI_API_KEY</code> 環境変数で管理されています
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                変更する場合は <code className="text-gray-400">.env.local</code> を直接編集してください
              </p>
            </div>
          </div>
        </section>
      )}

      {/* OpenAI 設定 */}
      {provider === "openai" && (
        <section className="bg-[#0f1118] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <h2 className="text-[13px] font-semibold text-gray-300 mb-4 tracking-wide uppercase">
            OpenAI 設定
          </h2>

          {/* API キー */}
          <div>
            <label className="block text-[12px] text-gray-400 mb-2">
              API キー
              {initial.openai_api_key_masked && (
                <span className="ml-2 text-[11px] text-green-500/80">
                  現在: {initial.openai_api_key_masked}
                </span>
              )}
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={
                initial.openai_api_key_masked
                  ? "変更する場合のみ入力"
                  : "sk-..."
              }
              className="
                w-full bg-white/[0.04] border border-white/[0.08] rounded-lg
                px-4 py-2.5 text-[13px] text-gray-200 placeholder-gray-600
                focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06]
                transition-all duration-200
              "
            />
          </div>

          {/* モデル選択 */}
          <div>
            <label className="block text-[12px] text-gray-400 mb-2">モデル</label>
            <div className="flex gap-2">
              {OPENAI_MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setOpenaiModel(m.value)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-lg border text-[12px]
                    transition-all duration-200
                    ${
                      openaiModel === m.value
                        ? "border-blue-500/50 bg-blue-500/[0.1] text-blue-300"
                        : "border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/[0.14]"
                    }
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Structured Outputs 説明 */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-lg">
            <span className="text-blue-400 text-sm mt-0.5">ℹ</span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              OpenAI 使用時は <strong className="text-gray-300">json_schema</strong> モードで厳密なスキーマ保証が有効になります。
              リトライは不要で、常に正しい構造のレスポンスが返ります。
            </p>
          </div>
        </section>
      )}

      {/* エラー / 成功メッセージ */}
      {error && (
        <p className="text-[12px] text-red-400 bg-red-500/[0.08] border border-red-500/[0.2] rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[12px] text-green-400 bg-green-500/[0.08] border border-green-500/[0.2] rounded-lg px-4 py-2.5">
          設定を保存しました
        </p>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="
          px-6 py-2.5 rounded-lg text-[13px] font-medium
          bg-purple-500/[0.15] border border-purple-500/40 text-purple-300
          hover:bg-purple-500/[0.25] hover:border-purple-500/60
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {saving ? "保存中..." : "設定を保存"}
      </button>
    </div>
  );
}
