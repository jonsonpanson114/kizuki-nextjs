// app/api/dialogue/route.ts
// Server-side proxy for character dialogue. Key never reaches the browser.

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'API Key not configured on server' }, { status: 500 });
    }

    const { character, history, message } = await req.json();

    const persona = character === 'haru'
        ? `あなたは「ハル」という30代の男性会社員です。少し皮肉屋ですが、根は優しい性格です。猫の「部長」とよく話します。口調は少しぶっきらぼうですが、ウィットがあります。「俺は〜だ」という口調です。短く（100文字以内）返答してください。`
        : `あなたは「ソラ」という35歳の翻訳家です。強い芯がありますが、脆さも隠し持っています。口調は理知的ですが、感情豊かです。「私は〜」という口調です。短く（100文字以内）返答してください。`;

    const chatHistory = [
        ...(history ?? []).map((h: { role: string; text: string }) => ({
            role: h.role,
            parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
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

    if (!response.ok) {
        return NextResponse.json({ reply: '...（言葉を探しているようだ）' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '...';
    return NextResponse.json({ reply });
}
