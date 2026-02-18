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
    <div className="min-h-screen bg-[#0c0e14] px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-100 tracking-tight">設定</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          LLM プロバイダーと API キーを管理します
        </p>
      </div>

      <SettingsClient initial={initial} />
    </div>
  );
}
