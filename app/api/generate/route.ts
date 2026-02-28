// app/api/generate/route.ts
// Server-side Gemini API proxy — key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を徹底的に研究したAI作家です。
以下の全ルールを完全に守って執筆してください。

# 伊坂幸太郎の核心
伊坂の物語には「些細な日常の違和感が、実は世界の秘密と繋がっている」という構造がある。
主人公は特別な人間ではない。ただ「気づいてしまった」だけだ。

# 文体の絶対ルール
1. **台詞から始めるか、台詞で核心に触れる** — 地の文で説明するな
2. **比喩は必ず具体的で奇妙** — 「悲しかった」ではなく「水曜日の午後3時に降る雨みたいな気分だった」
3. **「俺はただ平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で使う
4. **テンポ** — 長い段落は書かない。1〜3文で改行する

# 部長（猫）の扱い（最重要）
部長はただの猫ではない。物語の「哲学的コメンテーター」だ。
- 人間の言葉は話さないが、行動で鋭い返答をする
- ハルが迷った時、部長の一挙動が「答え」になる
- 例: ハル「これってどういう意味だと思う？」→ 部長は冷蔵庫の上から一瞥し、あくびをした。「質問が間違ってるってことか」とハルは解釈した。

# ユーザーの「気づき」の扱い（最重要）
ユーザーの気づきは「事件の発端」として扱え。
- 絶対にそのまま書かない
- 「誰かが仕組んだのかもしれない」という文脈に変換する
- 例: 「電車が混んでいた」→ 「なぜ今日だけ全員が3号車に乗ったのか」という謎に変換

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。違和感に気づき始める。ソラはまだ登場しない。
- **根 (Phase 2)**: ソラが登場。二人は別々に同じ謎に近づいている。
- **芽 (Phase 3)**: 伏線が一つ解け、別の謎が生まれる。
- **花 (Phase 4)**: 全ての謎が繋がる瞬間。カタルシス。

# 絶対禁止
- 教訓・説教・「大切なこと」の直接表現
- 「〜だと思った」の多用（内面を説明するな、行動で表せ）
- ハッピーエンドにしすぎること
- オチをつけきること（余韻で終われ）

# 出力形式
正当なJSON形式のみ。Markdownブロック不要。`;

function buildPrompt(
    phase: number,
    day: number,
    content: string,
    pendingMotifs: { id: string; motif: string }[],
    prevSummary: string
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const motifSection = pendingMotifs.length > 0
        ? pendingMotifs.map(m => `- 「${m.motif}」(ID: ${m.id})`).join('\n')
        : 'なし（自由に新しい伏線を仕込んでいい）';

    const prevSection = prevSummary
        ? `前回のエピソードのあらすじ:\n${prevSummary}\n（↑これを踏まえて「続きの物語」として書くこと）`
        : `前回のエピソード: なし（これが最初のエピソード）`;

    return `--- 執筆条件 ---
フェーズ: ${phaseName} (Phase ${phase}) / Day ${day}

${prevSection}

未回収の伏線（必ず物語に自然な形で登場させること）:
${motifSection}

今日のユーザーの気づき（これを「事件の発端」に変換すること）:
「${content}」

--- 指示 ---
- 400〜800文字の短編エピソードを日本語で書く
- 台詞を軸に展開する（説明せず、見せる）
- ユーザーの気づきを「誰かが仕組んだ謎」として変換して背景に織り込む
- 部長（猫）に哲学的な一幕を必ず入れる
- 未回収の伏線がある場合、それを物語の鍵として使い、可能なら回収する
- 新しい伏線は3〜5話に1回程度、自然に仕込む
- 余韻で終わること

--- 出力形式（このJSONのみ）---
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎあらすじ（100文字以内、事実のみ）",
  "mood_tags": ["ムードを表すタグ2〜3個"],
  "character": "haru" または "sora",
  "motifs": ["このエピソードに登場したモチーフ"],
  "new_foreshadowing": null または "新しく仕込んだ伏線モチーフ",
  "resolved_foreshadowing_id": null または "今回回収した伏線のID"
}`;
}

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'API Key not configured on server' }, { status: 500 });
    }

    const { phase, day, content, pendingMotifs = [], prevSummary = '' } = await req.json();

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: getSystemPrompt(phase) }] },
                contents: [{ role: 'user', parts: [{ text: buildPrompt(phase, day, content, pendingMotifs, prevSummary) }] }],
                generationConfig: {
                    temperature: 1.0,
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

    if (!text) {
        console.error('Gemini returned empty text. Full response:', JSON.stringify(data));
        return NextResponse.json({ error: 'AIからの応答が空でした。もう一度お試しください。' }, { status: 502 });
    }

    text = text.replace(/```json\n?|```/g, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) text = text.substring(first, last + 1);

    try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
    } catch (e) {
        console.error('JSON parse failed. Raw text was:', text);
        return NextResponse.json({ error: `JSON解析に失敗しました。AIの出力が不正な形式でした。` }, { status: 502 });
    }
}
