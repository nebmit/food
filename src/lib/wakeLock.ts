/**
 * Keeps the screen awake while cooking. Every call is best-effort: the API is missing on
 * desktop Safari and older Android, and the browser may refuse or drop the lock at any
 * time (a tab switch releases it, which is why we re-acquire on `visibilitychange`).
 */

interface WakeLockSentinelLike {
    released: boolean;
    release(): Promise<void>;
}

export interface WakeLockHandle {
    release(): void;
}

/** Requests a screen wake lock, holding it until the returned handle is released. */
export function keepAwake(): WakeLockHandle {
    const api = (navigator as Navigator & {
        wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
    }).wakeLock;

    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;

    async function acquire() {
        if (released || !api || document.visibilityState !== 'visible') return;
        try {
            sentinel = await api.request('screen');
            // Released while the request was in flight.
            if (released) void sentinel.release().catch(() => {});
        } catch {
            sentinel = null;
        }
    }

    function onVisibilityChange() {
        if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) {
            void acquire();
        }
    }

    void acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return {
        release() {
            released = true;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            void sentinel?.release().catch(() => {});
            sentinel = null;
        },
    };
}
