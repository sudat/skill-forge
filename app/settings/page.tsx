import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["llm_provider", "openai_api_key", "openai_model"]);

  const raw: Record<string, string> = {};
  for (const row of rows ?? []) {
    raw[row.key] = row.value;
  }

  const apiKey = raw["openai_api_key"] ?? "";
  const maskedKey = apiKey.length > 8 ? apiKey.slice(0, 8) + "***" : apiKey ? "設定済み" : "";

  const initial = {
    llm_provider: (raw["llm_provider"] ?? "zai") as "zai" | "openai",
    openai_api_key_masked: maskedKey,
    openai_model: raw["openai_model"] ?? "gpt-5.2",
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
      {/* Hero */}
      <section className="pt-12 pb-8 px-8">
        <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
          [05] Settings
        </span>
        <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
          設定
        </h1>
        <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
          LLM プロバイダーと API キーを管理します
        </p>
      </section>

      {/* Content */}
      <section className="px-8 pb-20">
        <SettingsClient initial={initial} />
      </section>
    </div>
  );
}
