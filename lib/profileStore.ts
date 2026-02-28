// lib/profileStore.ts
// Pure localStorage-based profile storage. No Expo, no AsyncStorage.

export interface Profile {
    id: string;
    current_phase: number;
    current_day: number;
    phase_started_at: string | null;
    created_at: string;
}

const KEY = 'kizuki_profile';

const DEFAULT: Profile = {
    id: 'local-user',
    current_phase: 1,
    current_day: 1,
    phase_started_at: null,
    created_at: new Date().toISOString(),
};

export const ProfileStore = {
    get(): Profile {
        if (typeof window === 'undefined') return { ...DEFAULT };
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : { ...DEFAULT };
        } catch {
            return { ...DEFAULT };
        }
    },

    save(partial: Partial<Profile>): Profile {
        const current = this.get();
        const updated: Profile = { ...current, ...partial };
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(KEY, JSON.stringify(updated));
            } catch {
                // ignore storage errors
            }
        }
        return updated;
    },

    reset(): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(KEY);
            } catch {
                // ignore
            }
        }
    }
};
