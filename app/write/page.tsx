'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileStore } from '@/lib/profileStore';
import { StoryStore } from '@/lib/storyStore';
import { KizukiStore } from '@/lib/kizukiStore';
import { ForeshadowingStore } from '@/lib/foreshadowingStore';
import { getRandomPrompt, getNextPhase } from '@/lib/prompts';
import Link from 'next/link';

export default function WritePage() {
    const router = useRouter();
    const profile = ProfileStore.get();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    const dailyPrompt = useMemo(() => getRandomPrompt(profile.current_phase), [profile.current_phase]);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        setError('');
        setStatusMessage('種を植えています...');

        try {
            // Calculate next day/phase
            const newDay = profile.current_day + 1;
            const newPhase = getNextPhase(newDay);

            // Save profile first (source of truth)
            const updatedProfile = ProfileStore.save({ current_day: newDay, current_phase: newPhase });

            // Save Kizuki log
            KizukiStore.save({ content, prompt: dailyPrompt, created_at: new Date().toISOString() });

            // Get pending motifs for foreshadowing continuity
            const pendingMotifs = ForeshadowingStore.getPending();

            // Get previous story summary for narrative continuity
            const allStories = StoryStore.getAll();
            const prevSummary = allStories.length > 0 ? allStories[0].summary : '';

            // Generate story via server-side API route (key never exposed to browser)
            setStatusMessage('物語が芽吹いています...');
            let story;
            try {
                const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phase: updatedProfile.current_phase,
                        day: updatedProfile.current_day,
                        content,
                        pendingMotifs,
                        prevSummary,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error ?? `HTTPエラー: ${res.status}`);
                }
                story = await res.json();
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error('AI generation failed:', msg);
                story = {
                    story_text: `（AI生成に失敗しました: ${msg}）\n\n「${content}」\n\nその言葉が、ふと風に乗って聞こえた気がした。ハルは珈琲を飲みながら、「また変なのが聞こえたな」と呟く。世界は相変わらず、少しだけズレているようだ。`,
                    summary_for_next: '生成失敗',
                    mood_tags: ['Error'],
                    character: 'haru' as const,
                    motifs: [],
                    new_foreshadowing: null,
                    resolved_foreshadowing_id: null,
                };
            }

            // Handle foreshadowing: resolve + plant new
            if (story.resolved_foreshadowing_id) {
                ForeshadowingStore.resolve(story.resolved_foreshadowing_id);
            }
            if (story.new_foreshadowing) {
                ForeshadowingStore.addMotif(story.new_foreshadowing);
            }

            // Save story
            const storyId = 'story-' + Date.now();
            StoryStore.save({
                id: storyId,
                content: story.story_text,
                summary: story.summary_for_next,
                mood_tags: story.mood_tags,
                character: story.character,
                phase: updatedProfile.current_phase,
                day: updatedProfile.current_day,
                created_at: new Date().toISOString(),
            });

            router.push(`/story/${storyId}`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(`エラーが発生しました: ${msg}`);
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    return (
        <main className="min-h-screen bg-washi text-sumi px-6 py-12 max-w-lg mx-auto flex flex-col">
            {/* Prompt */}
            <div className="text-center mb-8">
                <h1 className="font-serif text-xl tracking-widest mb-4">今日の問い</h1>
                <p className="font-serif text-lg leading-relaxed text-sumi/80">{dailyPrompt}</p>
            </div>

            {/* Textarea */}
            <textarea
                className="flex-1 min-h-52 w-full border border-stone/40 bg-white/60 p-4 font-serif text-base leading-relaxed resize-none focus:outline-none focus:border-sumi placeholder-stone/50"
                placeholder="ここに気づきを書いてください..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            {/* Status / Error */}
            {statusMessage && (
                <p className="text-center text-stone font-serif text-sm italic my-3">{statusMessage}</p>
            )}
            {error && (
                <p className="text-center text-red-600 text-sm my-3">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
                    className="border border-sumi px-6 py-4 font-serif text-xl tracking-widest hover:bg-sumi hover:text-washi transition-colors disabled:opacity-40"
                >
                    {isSubmitting ? '種まき中...' : '種をまく'}
                </button>
                <Link
                    href="/"
                    className="text-center border border-transparent px-6 py-3 font-serif text-base text-stone/60 hover:text-stone transition-colors"
                >
                    やめる
                </Link>
            </div>
        </main>
    );
}
