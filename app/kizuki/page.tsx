'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KizukiStore, Kizuki } from '@/lib/kizukiStore';

export default function KizukiPage() {
    const [entries, setEntries] = useState<Kizuki[]>([]);

    useEffect(() => {
        setEntries(KizukiStore.getAll());
    }, []);

    return (
        <main className="min-h-screen bg-washi text-sumi px-6 py-12 max-w-lg mx-auto">
            <div className="text-center mb-8">
                <h1 className="font-serif text-2xl tracking-wider">これまでの気づき</h1>
                <p className="text-stone text-sm mt-1">あなたが綴ってきた言葉たち</p>
            </div>

            {entries.length === 0 ? (
                <p className="text-center text-stone font-serif italic mt-20">まだ気づきがありません。<br />種をまきましょう。</p>
            ) : (
                <ul className="flex flex-col gap-6">
                    {entries.map(e => (
                        <li key={e.id} className="border-b border-stone/20 pb-5">
                            <p className="text-stone text-xs mb-1">
                                {new Date(e.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-stone/70 text-xs mb-2 italic">{e.prompt}</p>
                            <p className="font-serif text-base leading-relaxed">{e.content}</p>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-10 text-center">
                <Link href="/" className="text-stone text-sm underline">庭に戻る</Link>
            </div>
        </main>
    );
}
