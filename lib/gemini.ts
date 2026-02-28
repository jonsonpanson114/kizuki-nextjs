// lib/gemini.ts
// Gemini AI story and dialogue generation.

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';
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
1. **ユーザーの「気づき」の扱い**: 入力された「気づき」を物語の**核**にするが、そのまま文章には出さない。
2. **説教禁止**: 教訓めいたことは書かない。読者に委ねる。
3. **余韻**: オチをつけすぎない。「...かもしれない」という余韻で終わる。

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロック(\`\`\`json)は不要。`;

function buildUserPrompt(phase: number, day: number, kizukiContent: string): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の気づき:
"${kizukiContent}"

指示:
- 400〜800文字の短編エピソードを日本語で書いてください
- ユーザーの「気づき」を天気、BGM、背景の出来事として間接的に織り込んでください
- ユーザーに説教しないでください
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora"
}`;
}

export interface GeneratedStory {
    story_text: string;
    summary_for_next: string;
    mood_tags: string[];
    character: 'haru' | 'sora';
}

export async function generateStory(
    phase: number,
    day: number,
    kizukiContent: string,
): Promise<GeneratedStory> {
    if (!GEMINI_API_KEY) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY が設定されていません');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: getSystemPrompt(phase) }] },
                contents: [{ role: 'user', parts: [{ text: buildUserPrompt(phase, day, kizukiContent) }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API エラー (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AIからの応答が空でした');

    // Strip possible markdown fences
    text = text.replace(/```json\n?|```/g, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) text = text.substring(first, last + 1);

    return JSON.parse(text);
}

export async function generateReply(
    character: 'haru' | 'sora',
    history: { role: 'user' | 'model'; text: string }[],
    userMessage: string
): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error('API Key not configured');

    const persona = character === 'haru'
        ? `あなたは「ハル」という30代の男性会社員です。少し皮肉屋ですが、根は優しい性格です。猫の「部長」とよく話します。口調は少しぶっきらぼうですが、ウィットがあります。「俺は〜だ」という口調です。`
        : `あなたは「ソラ」という35歳の翻訳家です。強い芯がありますが、脆さも隠し持っています。口調は理知的ですが、感情豊かです。「私は〜」という口調です。`;

    const chatHistory = [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: userMessage }] },
    ];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: persona }] },
                contents: chatHistory,
                generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
            }),
        }
    );

    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '...';
}
