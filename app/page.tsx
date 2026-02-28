'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProfileStore } from '@/lib/profileStore';
import { StoryStore, Story } from '@/lib/storyStore';
import { getPhaseName } from '@/lib/prompts';

export default function HomePage() {
  const [profile, setProfile] = useState(() => ProfileStore.get());
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const p = ProfileStore.get();
    setProfile(p);
    setStories(StoryStore.getAll().slice(0, 5));
  }, []);

  return (
    <main className="min-h-screen bg-washi text-sumi px-6 py-12 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-stone text-sm mb-1">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-serif text-3xl mb-1 tracking-wider">
          {getPhaseName(profile.current_phase)}
        </h1>
        <p className="text-stone text-xs tracking-widest uppercase">
          Phase {profile.current_phase} — Day {profile.current_day}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 mb-12">
        <Link
          href="/write"
          className="block text-center border border-sumi px-6 py-4 font-serif text-xl tracking-widest hover:bg-sumi hover:text-washi transition-colors"
        >
          気づきを綴る
        </Link>
        <Link
          href="/kizuki"
          className="block text-center border border-stone/40 px-6 py-3 font-serif text-base text-stone hover:border-sumi hover:text-sumi transition-colors"
        >
          これまでの記憶
        </Link>
        <Link
          href="/dialogue/haru"
          className="block text-center border border-stone/40 px-6 py-3 font-serif text-base text-stone hover:border-sumi hover:text-sumi transition-colors"
        >
          ハルと話す
        </Link>
        {profile.current_phase >= 2 && (
          <Link
            href="/dialogue/sora"
            className="block text-center border border-indigo-200 px-6 py-3 font-serif text-base text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            ソラと話す
          </Link>
        )}
      </div>

      {/* Recent Stories */}
      {stories.length > 0 && (
        <section>
          <h2 className="font-serif text-lg border-b border-stone/30 pb-2 mb-4">紡がれた物語</h2>
          <ul className="flex flex-col gap-4">
            {stories.map(s => (
              <li key={s.id}>
                <Link href={`/story/${s.id}`} className="block group">
                  <p className="text-sm text-stone">
                    {new Date(s.created_at).toLocaleDateString('ja-JP')} — {s.character === 'haru' ? 'ハル' : 'ソラ'}
                  </p>
                  <p className="font-serif text-base leading-relaxed group-hover:text-stone/80 line-clamp-2">
                    {s.content.substring(0, 60)}…
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
