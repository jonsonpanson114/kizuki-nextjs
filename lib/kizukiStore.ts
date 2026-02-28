// lib/kizukiStore.ts
// Pure localStorage-based kizuki (reflection) storage.

export interface Kizuki {
    id: string;
    content: string;
    prompt: string;
    created_at: string;
}

const KEY = 'kizuki_log';

export const KizukiStore = {
    getAll(): Kizuki[] {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    save(entry: Omit<Kizuki, 'id'>): Kizuki {
        const id = 'kizuki-' + Date.now();
        const record: Kizuki = { id, ...entry };
        const all = this.getAll();
        all.unshift(record);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(KEY, JSON.stringify(all));
            } catch {
                // ignore
            }
        }
        return record;
    }
};
