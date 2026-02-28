'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StoryStore, Story } from '@/lib/storyStore';
import { getPhaseName } from '@/lib/prompts';

export default function StoryPage() {
    const params = useParams();
    const id = params.id as string;
    const [story, setStory] = useState<Story | null>(null);

    useEffect(() => {
        setStory(StoryStore.getById(id));
    }, [id]);

    if (!story) {
        return (
            <main className="min-h-screen bg-washi text-sumi px-6 py-12 max-w-lg mx-auto flex flex-col items-center justify-center">
                <p className="font-serif text-stone">物語が見つかりません...</p>
                <Link href="/" className="mt-6 text-stone text-sm underline">庭に戻る</Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-washi text-sumi px-6 py-12 max-w-lg mx-auto">
            {/* Meta */}
            <div className="text-center mb-8">
                <p className="text-stone text-xs tracking-widest uppercase mb-1">
                    {getPhaseName(story.phase)} — Day {story.day}
                </p>
                <p className="text-stone text-sm">
                    {new Date(story.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-stone text-xs mt-1">
                    {story.character === 'haru' ? '春（ハル）' : '空（ソラ）'}
                </p>
            </div>

            {/* Story text */}
            <article className="font-serif text-base leading-relaxed mb-8 whitespace-pre-wrap">
                {story.content}
            </article>

            {/* Tags */}
            {story.mood_tags && story.mood_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                    {story.mood_tags.map((tag, i) => (
                        <span key={i} className="text-xs text-stone border border-stone/30 px-2 py-1">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col gap-3">
                <Link
                    href="/write"
                    className="block text-center border border-sumi px-6 py-4 font-serif text-xl tracking-widest hover:bg-sumi hover:text-washi transition-colors"
                >
                    次の気づきを綴る
                </Link>
                <Link
                    href="/"
                    className="block text-center border border-transparent px-6 py-3 font-serif text-base text-stone/60 hover:text-stone transition-colors"
                >
                    庭に戻る
                </Link>
            </div>
        </main>
    );
}
