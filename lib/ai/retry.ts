import { z } from "zod";
import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type CallParams = {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
};

/**
 * Z.AI 用: json_object モードで AI を呼び出し、Zod スキーマでバリデーション。
 * 失敗時はエラー内容をメッセージに追記して最大 maxRetries 回リトライする。
 */
export async function callAIWithRetry<T extends z.ZodTypeAny>(
  params: CallParams,
  schema: T,
  client: OpenAI,
  maxRetries = 2,
): Promise<z.infer<T>> {
  const messages: ChatCompletionMessageParam[] = [...params.messages];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const completion = await client.chat.completions.create({
      model: params.model,
      messages,
      response_format: { type: "json_object" },
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 4096,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      if (attempt === maxRetries) {
        throw new Error(`AI returned invalid JSON after ${maxRetries + 1} attempts`);
      }
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content: "JSONのパースに失敗しました。有効なJSON形式で再度回答してください。",
      });
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) return result.data;

    if (attempt === maxRetries) {
      throw new Error(
        `AI response validation failed: ${JSON.stringify(result.error.issues)}`,
      );
    }

    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: `JSONの形式が不正です。以下のエラーを修正して、正しいJSON形式で再度回答してください。\nエラー: ${JSON.stringify(result.error.issues)}`,
    });
  }

  throw new Error("callAIWithRetry: unreachable");
}
