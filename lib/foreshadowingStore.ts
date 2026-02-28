// lib/foreshadowingStore.ts
// Stores pending (unresolved) foreshadowing motifs in localStorage.

export interface Motif {
    id: string;
    motif: string;
    created_at: string;
}

const KEY = 'kizuki_foreshadowing';

export const ForeshadowingStore = {
    getPending(): Motif[] {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    addMotif(motif: string): Motif {
        const entry: Motif = {
            id: 'motif-' + Date.now(),
            motif,
            created_at: new Date().toISOString(),
        };
        const all = this.getPending();
        all.push(entry);
        if (typeof window !== 'undefined') {
            try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
        }
        return entry;
    },

    resolve(id: string): void {
        const remaining = this.getPending().filter(m => m.id !== id);
        if (typeof window !== 'undefined') {
            try { localStorage.setItem(KEY, JSON.stringify(remaining)); } catch { /* ignore */ }
        }
    },
};
