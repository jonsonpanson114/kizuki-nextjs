// lib/storyStore.ts
// Pure localStorage-based story storage.

export interface Story {
    id: string;
    content: string;
    summary: string;
    mood_tags: string[];
    character: 'haru' | 'sora';
    phase: number;
    day: number;
    created_at: string;
}

const KEY = 'kizuki_stories';

export const StoryStore = {
    getAll(): Story[] {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    save(story: Story): void {
        const stories = this.getAll();
        // Prepend — newest first
        stories.unshift(story);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(KEY, JSON.stringify(stories));
            } catch {
                // ignore
            }
        }
    },

    getById(id: string): Story | null {
        return this.getAll().find(s => s.id === id) ?? null;
    }
};
