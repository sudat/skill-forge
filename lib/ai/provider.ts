import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AIProvider = "zai" | "openai";

export type AIProviderConfig = {
  client: OpenAI;
  model: string;
  provider: AIProvider;
};

const ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4";
const ZAI_MODEL = "glm-4.7";

/**
 * Supabase の app_settings テーブルから設定を読み、
 * 適切な OpenAI クライアントとモデル名を返す。
 * 設定が未構成の場合は環境変数 ZAI_API_KEY をフォールバックとして使用する。
 */
export async function getAIProvider(
  supabase: SupabaseClient<Database>,
): Promise<AIProviderConfig> {
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["llm_provider", "openai_api_key", "openai_model"]);

  const settings: Record<string, string> = {};
  for (const row of rows ?? []) {
    settings[row.key] = row.value;
  }

  const provider = (settings["llm_provider"] ?? "zai") as AIProvider;

  if (provider === "openai") {
    const apiKey = settings["openai_api_key"];
    if (!apiKey) {
      throw new Error(
        "OpenAI API キーが設定されていません。設定画面から登録してください。",
      );
    }
    const model = settings["openai_model"] || "gpt-5.2";
    const client = new OpenAI({ apiKey });
    return { client, model, provider: "openai" };
  }

  // Z.AI (default)
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error("ZAI_API_KEY が環境変数に設定されていません。");
  }
  const client = new OpenAI({ apiKey, baseURL: ZAI_BASE_URL });
  return { client, model: ZAI_MODEL, provider: "zai" };
}
