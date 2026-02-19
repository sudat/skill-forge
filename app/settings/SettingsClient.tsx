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
      <section className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-6">
        <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4 tracking-wide uppercase">
          LLM プロバイダー
        </h2>

        <div className="flex gap-3">
          {(["zai", "openai"] as const).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setProvider(p)}
              className={`
                flex-1 py-3 px-4 rounded-lg border text-[13px] font-medium
                transition-all duration-200 text-left
                ${
                  provider === p
                    ? "border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/[0.12] text-[var(--accent-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/50 text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${provider === p ? "bg-[var(--accent-primary)]" : "bg-[var(--text-tertiary)]"}`}
                />
                {p === "zai" ? "Z.AI" : "OpenAI"}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-1 ml-4">
                {p === "zai" ? "GLM-4.7 / json_object + リトライ" : "GPT-4o / json_schema 保証"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Z.AI 設定（参照のみ） */}
      {provider === "zai" && (
        <section className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-6">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4 tracking-wide uppercase">
            Z.AI 設定
          </h2>
          <div className="flex items-center gap-3 p-3.5 bg-[var(--accent-tertiary)]/[0.08] border border-[var(--accent-tertiary)]/[0.2] rounded-lg">
            <span className="text-[var(--accent-tertiary)] text-base">✓</span>
            <div>
              <p className="text-[13px] text-[var(--text-secondary)]">
                API キーは <code className="text-[var(--accent-tertiary)] text-[12px] bg-[var(--accent-tertiary)]/[0.15] px-1.5 py-0.5 rounded">ZAI_API_KEY</code> 環境変数で管理されています
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                変更する場合は <code className="text-[var(--text-secondary)]">.env.local</code> を直接編集してください
              </p>
            </div>
          </div>
        </section>
      )}

      {/* OpenAI 設定 */}
      {provider === "openai" && (
        <section className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-5">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4 tracking-wide uppercase">
            OpenAI 設定
          </h2>

          {/* API キー */}
          <div>
            <label htmlFor="openai-api-key" className="block text-[12px] text-[var(--text-secondary)] mb-2">
              API キー
              {initial.openai_api_key_masked && (
                <span className="ml-2 text-[11px] text-[var(--accent-tertiary)]">
                  現在: {initial.openai_api_key_masked}
                </span>
              )}
            </label>
            <input
              id="openai-api-key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={
                initial.openai_api_key_masked
                  ? "変更する場合のみ入力"
                  : "sk-..."
              }
              className="
                w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg
                px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
                focus:outline-none focus:border-[var(--accent-primary)]/50 focus:bg-[var(--bg-primary)]
                transition-all duration-200
              "
            />
          </div>

          {/* モデル選択 */}
          <div>
            <label htmlFor="openai-model" className="block text-[12px] text-[var(--text-secondary)] mb-2">モデル</label>
            <div className="flex gap-2" id="openai-model">
              {OPENAI_MODELS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setOpenaiModel(m.value)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-lg border text-[12px]
                    transition-all duration-200
                    ${
                      openaiModel === m.value
                        ? "border-[var(--accent-secondary)]/50 bg-[var(--accent-secondary)]/[0.1] text-[var(--accent-secondary)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/50 text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                    }
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Structured Outputs 説明 */}
          <div className="flex items-start gap-2.5 p-3 bg-[var(--accent-secondary)]/[0.06] border border-[var(--accent-secondary)]/[0.12] rounded-lg">
            <span className="text-[var(--accent-secondary)] text-sm mt-0.5">ℹ</span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              OpenAI 使用時は <strong className="text-[var(--text-primary)]">json_schema</strong> モードで厳密なスキーマ保証が有効になります。
              リトライは不要で、常に正しい構造のレスポンスが返ります。
            </p>
          </div>
        </section>
      )}

      {/* エラー / 成功メッセージ */}
      {error && (
        <p className="text-[12px] text-red-500 bg-red-500/[0.08] border border-red-500/[0.2] rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[12px] text-[var(--accent-tertiary)] bg-[var(--accent-tertiary)]/[0.08] border border-[var(--accent-tertiary)]/[0.2] rounded-lg px-4 py-2.5">
          設定を保存しました
        </p>
      )}

      {/* 保存ボタン */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="
          px-6 py-2.5 rounded-lg text-[13px] font-medium
          bg-[var(--accent-primary)]/[0.15] border border-[var(--accent-primary)]/40 text-[var(--accent-primary)]
          hover:bg-[var(--accent-primary)]/[0.25] hover:border-[var(--accent-primary)]/60
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {saving ? "保存中..." : "設定を保存"}
      </button>
    </div>
  );
}
