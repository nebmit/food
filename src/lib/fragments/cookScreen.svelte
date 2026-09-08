<script lang="ts">
    import { cookSteps } from "$lib/cookStep";
    import type { RecipeLayout } from "$lib/cookingTable";
    import { viewOf, type CookTimerStore } from "$lib/cookTimers";
    import { formatAmount, padStep } from "$lib/format";
    import type { Recipe } from "$lib/types";
    import { keepAwake } from "$lib/wakeLock";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";

    export let layout: RecipeLayout;
    export let recipe: Recipe;
    export let servings: number;
    export let scalingFactor = 1;
    /** The active step, 1-based. Bound, so the map behind the screen stays in sync. */
    export let step: number;
    export let timers: CookTimerStore;

    const dispatch = createEventDispatcher<{ close: void }>();

    $: steps = cookSteps(layout);
    $: total = steps.length;
    $: current = steps[step - 1];
    $: onLastStep = step >= total;

    /** Checked-off ingredients, keyed step:index — a cook's finger-memory, not persisted. */
    let checked: Record<string, boolean> = {};

    // Timers stay keyed by step, so a chip survives moving on; that is the parallel track.
    // The step you are looking at has its own timer control below, so it needs no chip.
    $: tracks = [...$timers.values()]
        .filter(timer => timer.step !== step)
        .map(viewOf)
        .sort((a, b) => a.step - b.step);

    let sheetOpen = false;
    /** Longer recipes run past a screenful, so open the sheet where the cook actually is. */
    let sheetRows: Record<number, HTMLElement | undefined> = {};
    $: if (sheetOpen) {
        const row = sheetRows[step];
        if (row) row.scrollIntoView({ block: "center" });
    }

    // The whole point of cook mode: the screen must not sleep at the stove.
    let wakeLock: ReturnType<typeof keepAwake> | null = null;
    onMount(() => {
        wakeLock = keepAwake();
    });
    onDestroy(() => {
        wakeLock?.release();
        timers.stop();
        timers.reset();
    });

    function go(next: number) {
        step = Math.min(total, Math.max(1, next));
        sheetOpen = false;
    }

    function toggleCheck(key: string) {
        checked = { ...checked, [key]: !checked[key] };
    }

    /** `at` is passed in, not read from scope, so the markup re-evaluates when the step moves. */
    function segmentClass(index: number, at: number): string {
        if (index + 1 === at) return "bg-accent";
        return index + 1 < at ? "bg-night-body" : "bg-night-edge";
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            if (sheetOpen) sheetOpen = false;
            else dispatch("close");
        }
    }
</script>

<svelte:window on:keydown={onKeydown} />

<div
    class="fixed inset-0 z-40 bg-night text-white flex flex-col md:hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Cook mode"
>
    <!-- Slim chrome: quit, what you are cooking, the way back to the whole list -->
    <div class="px-4 pt-3.5 pb-2.5 flex items-center gap-3">
        <button
            on:click={() => dispatch("close")}
            class="text-night-muted font-mono text-[11px] leading-none tracking-[.12em] py-1.5"
            aria-label="Exit cook mode">✕</button
        >
        <span
            class="flex-1 font-mono text-[11px] leading-none tracking-[.06em] text-night-muted truncate"
        >
            {recipe.RecipeName} · {servings}
            {recipe.MainVersion.PortionDescriptor}
        </span>
        <button
            on:click={() => (sheetOpen = true)}
            class="text-night-muted font-mono text-[11px] leading-none tracking-[.12em] uppercase py-1.5"
            >All steps</button
        >
    </div>

    <div class="px-4 flex gap-[3px]">
        {#each steps as entry, index (entry.step)}
            <button
                on:click={() => go(entry.step)}
                class="flex-1 h-5 flex items-center"
                aria-label="Step {entry.step}"
            >
                <span class="w-full h-[3px] block {segmentClass(index, step)}"></span>
            </button>
        {/each}
    </div>

    {#if tracks.length}
        <div class="px-4 pt-1.5 pb-2.5 flex gap-2 overflow-x-auto">
            {#each tracks as track (track.step)}
                <button
                    on:click={() => go(track.step)}
                    class="shrink-0 text-left border px-3 py-2 min-h-11 flex items-center gap-2.5 {track.finished
                        ? 'border-accent bg-accent/[.14]'
                        : 'border-night-edge'}"
                >
                    <span class="flex flex-col gap-[3px]">
                        <span
                            class="font-mono text-[9px] leading-none tracking-[.14em] uppercase {track.finished
                                ? 'text-accent'
                                : 'text-night-muted'}"
                        >
                            Step {padStep(track.step)} · {steps[track.step - 1]?.where}
                        </span>
                        <span class="text-[13px] leading-none text-night-text">
                            {track.finished ? "ready" : track.running ? "running" : "paused"}
                        </span>
                    </span>
                    <span
                        class="font-mono text-[17px] leading-none tabular-nums {track.finished
                            ? 'text-accent'
                            : 'text-night-muted'}"
                    >
                        {track.clock}
                    </span>
                </button>
            {/each}
        </div>
    {/if}

    <div class="flex-1 min-h-0 overflow-y-auto px-4 pt-1.5 flex flex-col gap-[18px]">
        {#if current}
            {@const timer = $timers.get(current.step)}
            <div class="flex flex-col gap-2.5">
                <div
                    class="font-mono text-[10px] leading-none tracking-[.16em] uppercase text-accent"
                >
                    Step {current.step} / {total} · {current.where}{current.stage.Setup
                        ? " · setup"
                        : ""}
                </div>
                <h2
                    class="text-[31px] leading-[1.04] tracking-[-.03em] font-bold m-0 text-pretty"
                >
                    {current.stage.Action}
                </h2>
                {#if current.stage.Hint}
                    <p class="text-base leading-[1.4] text-night-body m-0 text-pretty">
                        {current.stage.Hint}
                    </p>
                {/if}
                {#if current.from.length}
                    <!-- What is already in the pan: the grid's carry lines, said in words. -->
                    <div class="flex flex-wrap gap-1.5">
                        {#each current.from as source (source.step)}
                            <button
                                on:click={() => go(source.step)}
                                class="font-mono text-[10px] leading-none tracking-[.1em] uppercase text-night-muted border border-night-edge px-2 py-1.5"
                            >
                                {source.label}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            {#if current.adds.length}
                <div class="flex flex-col gap-1.5">
                    {#each current.adds as add, index (add.RecipeStageInputID)}
                        {@const key = `${current.step}:${index}`}
                        {@const off = checked[key]}
                        <button
                            on:click={() => toggleCheck(key)}
                            class="text-left border border-night-edge px-3 min-h-[46px] grid grid-cols-[1fr_auto] gap-3 items-center {off
                                ? 'bg-night-2'
                                : ''}"
                        >
                            <span class="flex items-baseline gap-2 min-w-0">
                                <span
                                    class="text-base leading-[1.15] {off
                                        ? 'text-night-muted line-through'
                                        : 'text-white'}"
                                >
                                    {add.Ingredient.IngredientName}
                                </span>
                                {#if add.Hint && add.Quantity !== undefined}
                                    <span class="text-[11px] text-night-muted truncate"
                                        >{add.Hint}</span
                                    >
                                {/if}
                            </span>
                            <span
                                class="text-base font-bold tabular-nums whitespace-nowrap {off
                                    ? 'text-night-muted'
                                    : 'text-white'}"
                            >
                                {formatAmount(add, scalingFactor)}
                            </span>
                        </button>
                    {/each}
                </div>
            {/if}

            {#if current.durationMinutes}
                {@const view = timer ? viewOf(timer) : null}
                <div class="flex gap-2">
                    <button
                        on:click={() =>
                            timers.toggle(current.step, current.durationMinutes ?? 0)}
                        class="flex-1 border border-accent px-3.5 py-3 min-h-[60px] flex items-center justify-between gap-3.5"
                    >
                        <span class="flex flex-col gap-[3px] text-left">
                            <span
                                class="font-mono text-[9px] leading-none tracking-[.16em] uppercase text-accent"
                            >
                                {view?.finished
                                    ? "Time is up"
                                    : view?.running
                                      ? "Tap to pause"
                                      : view
                                        ? "Tap to resume"
                                        : `Start ${current.durationMinutes} min timer`}
                            </span>
                            <span class="text-xs text-night-muted"
                                >{current.stage.Hint ?? current.stage.Action}</span
                            >
                        </span>
                        <span
                            class="font-mono text-[28px] leading-none tabular-nums tracking-[-.02em]"
                        >
                            {view ? view.clock : `${padStep(current.durationMinutes)}:00`}
                        </span>
                    </button>
                    {#if view}
                        <button
                            on:click={() => timers.extend(current.step, 2)}
                            class="w-[76px] border border-night-edge font-mono text-[11px] leading-none tracking-[.1em] uppercase text-night-body"
                            >+2 min</button
                        >
                    {/if}
                </div>
            {/if}
        {/if}
        <div class="h-1.5"></div>
    </div>

    <div class="border-t border-night-rule px-4 pt-2.5 pb-5 grid grid-cols-[76px_1fr] gap-2">
        <button
            on:click={() => go(step - 1)}
            disabled={step <= 1}
            class="border border-night-edge font-mono text-[11px] leading-none tracking-[.1em] uppercase text-night-body h-14 disabled:opacity-40"
            >← Back</button
        >
        <button
            on:click={() => (onLastStep ? dispatch("close") : go(step + 1))}
            class="border border-accent bg-accent text-white font-mono text-xs leading-none tracking-[.12em] uppercase h-14 px-2.5"
        >
            {onLastStep ? "Finish" : "Next step"}
        </button>
    </div>

    {#if sheetOpen}
        <div class="absolute inset-0 bg-night/60 flex flex-col justify-end">
            <button
                on:click={() => (sheetOpen = false)}
                class="flex-1"
                aria-label="Close all steps"
            ></button>
            <div
                class="bg-white text-ink border-t border-ink flex flex-col max-h-[74%]"
            >
                <div class="pt-2.5 pb-1 flex justify-center">
                    <div class="w-11 h-1 rounded-sm bg-carry"></div>
                </div>
                <div
                    class="px-5 pt-2 pb-3 flex items-baseline justify-between border-b border-ink"
                >
                    <span class="text-lg font-bold tracking-[-.02em]">All steps</span>
                    <span
                        class="font-mono text-[10px] leading-none tracking-[.1em] text-muted-3"
                        >{total} steps</span
                    >
                </div>
                <div class="flex-1 min-h-0 overflow-y-auto">
                    {#each steps as entry (entry.step)}
                        <button
                            on:click={() => go(entry.step)}
                            bind:this={sheetRows[entry.step]}
                            class="w-full text-left border-b border-rule px-5 py-3 grid grid-cols-[30px_1fr_auto] gap-3 items-center min-h-14 {entry.step ===
                            step
                                ? 'bg-hover'
                                : ''}"
                        >
                            <span
                                class="font-mono text-xs leading-none {entry.step === step
                                    ? 'text-accent'
                                    : 'text-muted-3'}"
                            >
                                {padStep(entry.step)}
                            </span>
                            <span class="flex flex-col gap-0.5">
                                <span
                                    class="text-base font-medium leading-[1.2] text-pretty {entry.step <
                                    step
                                        ? 'text-muted'
                                        : ''}"
                                >
                                    {entry.stage.Action}
                                </span>
                                {#if entry.stage.Hint}
                                    <span class="text-xs text-muted-2 text-pretty"
                                        >{entry.stage.Hint}</span
                                    >
                                {/if}
                            </span>
                            <span
                                class="font-mono text-[11px] leading-none whitespace-nowrap text-muted-3"
                            >
                                {entry.where}
                            </span>
                        </button>
                    {/each}
                </div>
                <div class="h-5"></div>
            </div>
        </div>
    {/if}
</div>
