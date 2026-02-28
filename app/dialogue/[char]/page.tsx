'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Character = 'haru' | 'sora';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const CHARACTER_INFO = {
    haru: { name: '春（ハル）', color: 'text-amber-800', border: 'border-amber-200' },
    sora: { name: '空（ソラ）', color: 'text-indigo-800', border: 'border-indigo-200' },
};

export default function DialoguePage() {
    const params = useParams();
    const charId = (params.char as string) === 'sora' ? 'sora' : 'haru';
    const char = CHARACTER_INFO[charId as Character];

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const greeting: Message = {
            role: 'model',
            text: charId === 'haru'
                ? '……また来たのか。まあ、部長も退屈してただろうから、ちょうどいい。'
                : 'こんにちは。何か、話したいことでもあった？',
        };
        setMessages([greeting]);
    }, [charId]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;
        const userMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            // Call server-side API route — key never leaves the server
            const res = await fetch('/api/dialogue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character: charId,
                    history: messages.map(m => ({ role: m.role, text: m.text })),
                    message: input,
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', text: data.reply ?? '...' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'model', text: '...（言葉を探しているようだ）' }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <main className="min-h-screen bg-washi text-sumi flex flex-col max-w-lg mx-auto">
            {/* Header */}
            <div className={`text-center px-6 py-4 border-b ${char.border}`}>
                <h1 className={`font-serif text-xl ${char.color}`}>{char.name}</h1>
                <Link href="/" className="text-stone text-xs">← 庭に戻る</Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                        <div className={`px-4 py-3 font-serif text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-sumi text-washi'
                            : `bg-white/70 border ${char.border} ${char.color}`
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="self-start">
                        <div className={`px-4 py-3 font-serif text-sm ${char.color} border ${char.border} bg-white/70 italic`}>
                            ……
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className={`px-6 py-4 border-t ${char.border} flex gap-3`}>
                <input
                    type="text"
                    className="flex-1 border border-stone/40 px-3 py-2 font-serif text-sm focus:outline-none focus:border-sumi bg-white/60"
                    placeholder="何か言いたいことは？"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    disabled={isSending || !input.trim()}
                    className="border border-sumi px-4 py-2 font-serif text-sm hover:bg-sumi hover:text-washi transition-colors disabled:opacity-40"
                >
                    送る
                </button>
            </div>
        </main>
    );
}
