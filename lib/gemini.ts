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
4. **物語の進行**: 最初は小さな違和感から始めて、徐々に事件の規模を大きくしてください。3〜5話に一度、誰かが直接現れたり、大きな事件が起きたりしてください。キャラクターの周囲の状況が変化していく様を描写してください。

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロック(\`\`\`json)は不要。`;

const getDailyGuideline = (day: number): string => {
    const patterns = [
        `【今日の焦点：影】
ユーザーの気づきを、物語の「影」として扱ってください。
誰かが見ている、あるいは誰かに見られている感覚。影だけが動いている。視線を感じる。
誰かが動かしている巨大な何かの末端に触れてください。`,

        `【今日の焦点：鏡像】
ユーザーの気づきを、自分ではない何かの「反映」として扱ってください。
鏡を見た時、いつもと違う表情が見えた気がした。
日常の中に、反転した世界が忍び込んでいる。`,

        `【今日の焦点：不在の痕跡】
ユーザーの気づきを、そこにいない「誰か」の痕跡として扱ってください。
温まっていないコーヒー。読みかけの本。消えたはずの傷。
誰かがいたという証拠だけが残されている。`,

        `【今日の焦点：重なり】
ユーザーの気づきを、二つの時間軸が交差する瞬間として扱ってください。
昨日と今日が少しだけ重なっている。
過去の記憶が、今の風景の隙間から漏れ出している。`,

        `【今日の焦点：警告】
ユーザーの気づきを、誰かからの「警告」として扱ってください。
部長（猫）が不自然に鳴いた。ラジオのニュースが気になる。
「近づかない方がいい」と誰かが囁いているような空気。`,

        `【今日の焦点：共犯者】
ユーザーの気づきを、知らぬ間に加えられた「共犯」として扱ってください。
選択したはずのない道を選んでしまった。知らないはずの言葉が口から出た。
誰かが私を動かしている。でも、それに抵抗もしていない。`,

        `【今日の焦点：境界線】
ユーザーの気づきを、日常と非日常の「境界」として扱ってください。
ここから先は、普通じゃない。でも踏み出している。
足元の線を超えた瞬間、世界の色が少しだけ変わる。`,

        `【今日の焦点：偶然】
ユーザーの気づきを、あまりにも出来すぎた「偶然」として扱ってください。
三つ目の「偶然」はもう偶然じゃない。
誰かが意図的に、パズルのピースを配置している。`,

        `【今日の焦点：記憶の改竄】
ユーザーの気づきを、思い出が少しずつ「書き換わっている」感覚として扱ってください。
昨日はこうだったはず。でも、記憶が違う。
誰かが、私の記憶の中を何か書き換えているのかもしれない。`,

        `【今日の焦点：予兆】
ユーザーの気づきを、まだ起きていない「事件」の予兆として扱ってください。
空の色が変わった。鳥がいなくなった。
何かが来る。その前触れだけが、先に届いている。`,

        `【今日の焦点：分岐点】
ユーザーの気づきを、運命が分かれた「あの瞬間」として扱ってください。
ここで違う選択をしていたら、人生はどう変わっていたか。
見えない分岐点に、今立っている。`,

        `【今日の焦点：対話】
ユーザーの気づきを、見えない誰かとの「対話」として扱ってください。
返事を求められたような気がした。でも、誰もいない。
部屋の中に、もう一人の誰かがいるような気配。`,

        `【今日の焦点：反復】
ユーザーの気づきを、過去の出来事が「繰り返されている」として扱ってください。
似たようなことが、また起こった。でも、少し違う。
誰かが、同じシナリオを何度も上演している。`,

        `【今日の焦点：観察者】
ユーザーの気づきを、自分を「観察」している感覚として扱ってください。
まるで別の誰かの目で、自分を見ている。
自分の行動が、どこか他人事に感じる。`,

        `【今日の焦点：時間の歪み】
ユーザーの気づきを、時間が少しだけ「ズレている」感覚として扱ってください。
時計が狂っているのかもしれない。昨日が今日に混ざっている。
時間が正しく流れていないような、あの感覚。`,

        `【今日の焦点：選択】
ユーザーの気づきを、知らないうちに「選択」させられていたこととして扱ってください。
自分の意志で選んだつもりだった。でも、最初から一つの道しか用意されていなかった。
誰かが、道を用意していて、私はそこを歩くだけだった。`,

        `【今日の焦点：接点】
ユーザーの気づきを、世界が一箇所だけ「繋がっている」として扱ってください。
そこだけ、世界が重なっている。見えない糸で繋がっている。
二人の主人公（ハルとソラ）の間に、まだ見えない接点がある。`,

        `【今日の焦点：異界】
ユーザーの気づきを、日常に開けた「異界への入り口」として扱ってください。
いつもの風景に、いつもと違う扉がある。
開けてしまった。もう、戻れないかもしれない。`,

        `【今日の焦点：欠片】
ユーザーの気づきを、巨大な謎の「欠片」として扱ってください。
小さな破片を見つけた。全体像が見えないけど、確かに何かの一部。
全ての欠片が集まった時、何が見えるのか。`,

        `【今日の焦点：沈黙】
ユーザーの気づきを、言葉にできない「沈黙」として扱ってください。
何かが言いたげに沈黙している。でも、言葉にならない。
沈黙の中に、最も大きな真実があるような気がする。`,

        `【今日の焦点：距離】
ユーザーの気づきを、測れない「距離」として扱ってください。
物理的には近いのに、心は遠い。あるいは逆に。
誰かとの距離が、急に変わった気がする。`,
    ];

    return patterns[(day - 1) % patterns.length];
};

function buildUserPrompt(phase: number, day: number, kizukiContent: string, prevSummary: string = ''): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const dailyGuideline = getDailyGuideline(day);

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

${dailyGuideline}

ユーザーの今日の気づき:
"${kizukiContent}"

前回のあらすじ:
${prevSummary || '（これが最初のエピソードです）'}

指示:
- **物語は必ず前回のあらすじから続けてください。単発で終わらせず、話を前に進めてください。**
- **伊坂幸太郎の連作小説のように、キャラクターと謎が継続していく物語を書いてください。**
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
    prevSummary: string = '',
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
                contents: [{ role: 'user', parts: [{ text: buildUserPrompt(phase, day, kizukiContent, prevSummary) }] }],
                generationConfig: {
                    temperature: 0.7,
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
