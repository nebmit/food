import { get, writable, type Readable } from 'svelte/store';

/**
 * Per-step kitchen timers. A timer keeps running once you move on to another step —
 * that is what puts the oven on the track rail while you work at the bench.
 *
 * State is in memory only: leaving the recipe ends the cook.
 */

export interface CookTimer {
    step: number;
    /** Total seconds the timer counts down from, including any extensions. */
    totalSeconds: number;
    /** Seconds already counted while running. */
    elapsedSeconds: number;
    running: boolean;
}

export interface TimerView extends CookTimer {
    remainingSeconds: number;
    finished: boolean;
    /** `04:12`, or `-00:30` once it has overrun. */
    clock: string;
}

/** `04:12`; negative remainders print with a leading minus. */
export function formatClock(seconds: number): string {
    const sign = seconds < 0 ? '-' : '';
    const total = Math.abs(Math.round(seconds));
    const minutes = Math.floor(total / 60);
    return `${sign}${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function viewOf(timer: CookTimer): TimerView {
    const remainingSeconds = timer.totalSeconds - timer.elapsedSeconds;
    return {
        ...timer,
        remainingSeconds,
        finished: remainingSeconds <= 0,
        clock: formatClock(remainingSeconds),
    };
}

export interface CookTimerStore extends Readable<Map<number, CookTimer>> {
    start(step: number, minutes: number): void;
    toggle(step: number, minutes: number): void;
    extend(step: number, minutes: number): void;
    dismiss(step: number): void;
    reset(): void;
    /** Advance every running timer; exported so tests can drive it with a fake clock. */
    tick(seconds?: number): void;
    stop(): void;
}

export function createCookTimers(
    interval: (handler: () => void, ms: number) => unknown = setInterval,
    clear: (handle: unknown) => void = handle => clearInterval(handle as ReturnType<typeof setInterval>),
): CookTimerStore {
    const timers = writable(new Map<number, CookTimer>());
    let handle: unknown = null;

    /** The ticker only runs while at least one timer does. */
    function sync(map: Map<number, CookTimer>) {
        const anyRunning = [...map.values()].some(timer => timer.running);
        if (anyRunning && handle === null) {
            handle = interval(() => store.tick(1), 1000);
        } else if (!anyRunning && handle !== null) {
            clear(handle);
            handle = null;
        }
    }

    function update(mutate: (map: Map<number, CookTimer>) => void) {
        timers.update(current => {
            const next = new Map(current);
            mutate(next);
            sync(next);
            return next;
        });
    }

    const store: CookTimerStore = {
        subscribe: timers.subscribe,

        start(step, minutes) {
            update(map => {
                const existing = map.get(step);
                map.set(step, {
                    step,
                    totalSeconds: existing?.totalSeconds ?? minutes * 60,
                    elapsedSeconds: existing?.elapsedSeconds ?? 0,
                    running: true,
                });
            });
        },

        toggle(step, minutes) {
            const current = get(timers).get(step);
            if (current && viewOf(current).finished) {
                // Time is up: the next tap starts a fresh round. A per-side or per-batch
                // step carries the time of one round, so this is how the second side runs.
                update(map => {
                    map.set(step, { step, totalSeconds: minutes * 60, elapsedSeconds: 0, running: true });
                });
            } else if (current?.running) {
                update(map => {
                    map.set(step, { ...current, running: false });
                });
            } else {
                store.start(step, minutes);
            }
        },

        extend(step, minutes) {
            update(map => {
                const current = map.get(step);
                if (!current) return;
                map.set(step, { ...current, totalSeconds: current.totalSeconds + minutes * 60, running: true });
            });
        },

        dismiss(step) {
            update(map => {
                map.delete(step);
            });
        },

        reset() {
            update(map => {
                map.clear();
            });
        },

        tick(seconds = 1) {
            update(map => {
                for (const [step, timer] of map) {
                    if (!timer.running) continue;
                    map.set(step, { ...timer, elapsedSeconds: timer.elapsedSeconds + seconds });
                }
            });
        },

        stop() {
            if (handle !== null) {
                clear(handle);
                handle = null;
            }
        },
    };

    return store;
}
