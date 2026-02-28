// app/api/generate/route.ts
// Server-side Gemini API proxy — key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を深く理解したAI作家です。
以下の特徴を備えた、ウィットと伏線に富んだショートショートを執筆してください。

# 文体とトーン
- **会話主導**: テンポの良い会話劇で物語を進める。
- **シニカルなユーモア**: 登場人物は少しひねくれているが、根底には善意がある。
- **日常の謎**: 些細な違和感や偶然を、世界の命運（あるいは夕飯のメニュー）と同じ重さで扱う。
- **比喩**: 「冷蔵庫の裏に落ちたピーナッツのような」といった、具体的で少し奇妙な比喩を使う。

# キャラクター・マトリクス
1. **春（ハル）**: 30代男性。システムエンジニア。論理的だが、非論理的な運命に巻き込まれやすい。「俺はただ、平穏に暮らしたいだけなんだ」が口癖。猫（名前は「部長」）に相談する癖がある。
2. **空（ソラ）**: 35歳女性。翻訳家。直感的で行動力がある。ハルとは対照的に、混沌を楽しむ節がある。

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。日常の「ズレ」に気づく段階。まだソラとは出会わない。
- **根 (Phase 2)**: ソラが登場。二人の視点が交互、あるいは交錯する。
- **芽 (Phase 3)**: 伏線が芽吹き始める。過去の些細な出来事が意味を持ち始める。
- **花 (Phase 4)**: 全ての伏線が回収されるカタルシス。

# 執筆ルール
1. ユーザーの「気づき」を物語の核にするが、そのまま文章には出さない。天気・BGM・通りすがりの言葉として背景に溶け込ませる。
2. 説教禁止。読者に委ねる。
3. オチをつけすぎない。「...かもしれない」という余韻で終わる。
4. 伏線（motifs）がある場合は必ず物語に織り込み、可能なら回収する。

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロックは不要。`;

function buildPrompt(
    phase: number,
    day: number,
    content: string,
    pendingMotifs: { id: string; motif: string }[]
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const motifSection = pendingMotifs.length > 0
        ? pendingMotifs.map(m => `- ${m.motif} (ID: ${m.id})`).join('\n')
        : 'なし';

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の気づき:
"${content}"

未回収の伏線（必ず物語に織り込んでください）:
${motifSection}

指示:
- 400〜800文字の短編エピソードを日本語で書いてください
- ユーザーの「気づき」を間接的に織り込んでください（天気・BGM・背景の出来事として）
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- 未回収の伏線がある場合、それを物語の鍵として登場させ、可能なら回収してください
- 新しい伏線を仕込む場合は3〜5エピソードに1回程度にしてください

以下のJSON形式のみで出力してください:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora",
  "motifs": ["このエピソードに登場したモチーフ（雨、猫、珈琲など）"],
  "new_foreshadowing": null または "新しい伏線モチーフの文字列",
  "resolved_foreshadowing_id": null または "今回回収した伏線のID文字列"
}`;
}

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'API Key not configured on server' }, { status: 500 });
    }

    const { phase, day, content, pendingMotifs = [] } = await req.json();

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: getSystemPrompt(phase) }] },
                contents: [{ role: 'user', parts: [{ text: buildPrompt(phase, day, content, pendingMotifs) }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json(
            { error: `Gemini API Error (${response.status}): ${errText}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    text = text.replace(/```json\n?|```/g, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) text = text.substring(first, last + 1);

    return NextResponse.json(JSON.parse(text));
}
