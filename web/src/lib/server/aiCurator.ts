import { LoungeContactPurpose, MessagePriority } from "../types";

export interface AICurationResult {
  aiPriority: MessagePriority;
  aiSummary: string;
}

const PURPOSE_LABELS: Record<LoungeContactPurpose, string> = {
  funding: "資金調達・出資相談",
  partnership: "事業提携・PoC提案",
  purchase: "サービス導入・購入検討",
  inquiry: "詳細問い合わせ",
  greeting: "挨拶・情報交換",
};

/**
 * 送信されたメッセージの目的・提案要約・詳細を評価し、
 * 優先度(high/medium/low)と1文のキャッチーなAI要約を生成する。
 */
export async function curateMessage(params: {
  purpose: LoungeContactPurpose;
  benefitSummary: string;
  details: string;
  senderName: string;
  senderCompany: string;
}): Promise<AICurationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `あなたはビジネスイベントの優秀なビジネスマッチングAI秘書です。
送信者「${params.senderCompany || "不明"} ${params.senderName}」から受信者（登壇者/出展者）へ届いた以下のメッセージを分析し、受信者が今すぐ確認・返信するべき優先度と1文の要約を決定してください。

【メッセージ情報】
- 連絡目的: ${PURPOSE_LABELS[params.purpose] ?? params.purpose}
- 提案・メリット要約: ${params.benefitSummary}
- 詳細本文: ${params.details}

【評価基準】
- high: 具体的な資金調達・出資・実効性の高い事業提携・大口のサービス導入など、受取人に直接の事業メリットや商談価値が高い連絡。
- medium: 一般的な製品質問、事前リサーチ、情報交換、イベント後面談の要望。
- low: 単なる挨拶、お礼、定型文、内容が薄い連絡。

以下のJSONフォーマットのみを出力してください。Markdownなどの装飾は不要です。
{
  "aiPriority": "high" | "medium" | "low",
  "aiSummary": "受信者が一目で理解できる1文の要約 (30文字以内)"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text) as { aiPriority?: MessagePriority; aiSummary?: string };
          if (parsed.aiPriority && parsed.aiSummary) {
            return {
              aiPriority: parsed.aiPriority,
              aiSummary: parsed.aiSummary,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Gemini API Curation failed, falling back to rule-based logic:", err);
    }
  }

  // フォールバック: ルールベース判定
  let priority: MessagePriority = "low";
  if (params.purpose === "funding" || params.purpose === "partnership") {
    priority = "high";
  } else if (params.purpose === "purchase" || params.purpose === "inquiry") {
    priority = "medium";
  }

  // キーワード補助
  const combinedText = `${params.benefitSummary} ${params.details}`.toLowerCase();
  if (combinedText.includes("出資") || combinedText.includes("投資") || combinedText.includes("提携") || combinedText.includes("poc")) {
    priority = "high";
  }

  const purposeName = PURPOSE_LABELS[params.purpose] ?? "連絡";
  const summaryPrefix = params.senderCompany ? `${params.senderCompany}からの` : "";
  const aiSummary = `${summaryPrefix}${purposeName}: ${params.benefitSummary.slice(0, 25)}`;

  return {
    aiPriority: priority,
    aiSummary,
  };
}
