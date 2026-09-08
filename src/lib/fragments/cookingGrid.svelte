<script lang="ts">
    import { bandOf, type Cell, type RecipeLayout } from "$lib/cookingTable";
    import { formatAmount, formatTime, padStep } from "$lib/format";
    import { imageFallback } from "$lib/imageFallback";
    import type { Recipe } from "$lib/types";
    import { createEventDispatcher } from "svelte";

    /** The precomputed grid; portion-independent. */
    export let layout: RecipeLayout;
    export let recipe: Recipe;
    /** Multiplier applied to every ingredient amount. */
    export let scalingFactor = 1;
    export let servings: number;
    /** Cook mode: which step is active (1-based) and whether it is on at all. */
    export let cooking = false;
    export let activeStep = 0;
    /** The mobile map: narrower columns, smaller type, no image in the dish cell. */
    export let compact = false;

    const dispatch = createEventDispatcher<{ pick: number }>();

    const TINTS = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4"];
    /** The 1280px page minus its 40px gutters: what the desktop grid should fit in. */
    const DESKTOP_WIDTH = 1200;

    $: version = recipe.MainVersion;
    $: imageUrl =
        "/images/recipes/" + encodeURIComponent(recipe.RecipeName) + ".webp";
    $: columns = columnTemplate(layout.actionCols, compact);

    /** The design's 112px minimum per action column, relaxed for wide recipes so they still fit. */
    function columnTemplate(actionCols: number, isCompact: boolean): string {
        if (isCompact) {
            return `132px repeat(${actionCols}, minmax(96px, 1fr)) 96px`;
        }
        const available = DESKTOP_WIDTH - 250 - 190 - 10 * (actionCols + 1);
        const min = Math.min(112, Math.max(80, Math.floor(available / actionCols)));
        return `250px repeat(${actionCols}, minmax(${min}px, 1fr)) 190px`;
    }
    $: activeCell = cooking
        ? layout.cells.find(
              (c) =>
                  (c.kind === "stage" || c.kind === "setup") &&
                  c.step === activeStep,
          )
        : undefined;
    $: activeBand = activeCell ? bandOf(activeCell) : null;
    $: totalTime = version.ActiveTimeMinutes + version.PassiveTimeMinutes;

    /** Action blocks tint deeper toward the finish. */
    function tint(col: number, actionCols: number): string {
        if (actionCols <= 1) return TINTS[0];
        const index = Math.round(
            ((col - 1) / (actionCols - 1)) * (TINTS.length - 1),
        );
        return TINTS[index];
    }

    function inBand(row: number, band: [number, number] | null): boolean {
        return band !== null && row >= band[0] && row < band[1];
    }

    function cellKey(cell: Cell): string {
        return `${cell.kind}-${cell.row}-${cell.col}`;
    }

    function area(cell: Cell): { row: string; col: string } {
        const colSpan = cell.kind === "setup" ? cell.colSpan : 1;
        return {
            row: `${cell.row} / span ${cell.rowSpan}`,
            col: `${cell.col + 1} / span ${colSpan}`,
        };
    }
</script>

<div
    class="grid gap-x-[10px] gap-y-0 pb-px {compact
        ? 'gap-x-1.5 text-[11px] leading-[1.3]'
        : 'text-[13px] leading-[1.35]'}"
    style:grid-template-columns={columns}
>
    {#each layout.cells as cell (cellKey(cell))}
        {@const at = area(cell)}
        {#if cell.kind === "ingredient"}
            {@const quantified = cell.input.Quantity !== undefined}
            <div
                class="relative border border-ink -mb-px flex justify-between gap-2.5 {compact
                    ? 'px-2 py-1.5'
                    : 'px-3 py-2'}"
                style:grid-row={at.row}
                style:grid-column={at.col}
            >
                <span class="min-w-0">
                    <span class={compact ? "block truncate" : ""}
                        >{cell.input.Ingredient.IngredientName}</span
                    >
                    {#if cell.input.Hint && quantified && !compact}
                        <div class="text-muted-2 text-[11px] mt-px">
                            {cell.input.Hint}
                        </div>
                    {/if}
                </span>
                <!-- Quantities never wrap; a qualitative amount ("to taste") is prose and may. -->
                <span
                    class="text-muted-2 tabular-nums text-right {quantified
                        ? 'whitespace-nowrap'
                        : ''} {compact ? 'truncate max-w-[55%]' : ''}"
                >
                    {formatAmount(cell.input, scalingFactor)}
                </span>
                {#if inBand(cell.row, activeBand)}
                    <div
                        class="absolute inset-0 pointer-events-none bg-accent/[.07] border-l-[3px] border-accent"
                    ></div>
                {/if}
            </div>
        {:else if cell.kind === "reference"}
            <div
                class="relative border border-ink -mb-px flex flex-col justify-center gap-0.5 {compact
                    ? 'px-2 py-1.5'
                    : 'px-3 py-2'}"
                style:grid-row={at.row}
                style:grid-column={at.col}
            >
                <span
                    class="font-mono text-[10px] leading-none tracking-[.1em] uppercase text-accent"
                >
                    {cell.label}
                </span>
                {#if !compact}
                    <span class="text-[11px] text-muted-2">{cell.caption}</span>
                {/if}
                {#if inBand(cell.row, activeBand)}
                    <div
                        class="absolute inset-0 pointer-events-none bg-accent/[.07] border-l-[3px] border-accent"
                    ></div>
                {/if}
            </div>
        {:else if cell.kind === "stage" || cell.kind === "setup"}
            <button
                type="button"
                class="relative text-left border border-ink -mb-px cursor-pointer flex flex-col justify-center {compact
                    ? 'px-2 py-[7px] gap-[3px]'
                    : 'px-3 py-2.5 gap-[5px]'} {cell.kind === 'setup'
                    ? 'bg-paper'
                    : tint(cell.col, layout.actionCols)}"
                style:grid-row={at.row}
                style:grid-column={at.col}
                on:click={() => dispatch("pick", cell.step)}
            >
                <div
                    class="font-mono leading-none text-muted-3 {compact
                        ? 'text-[9px]'
                        : 'text-[10px]'}"
                >
                    {padStep(cell.step)}{#if cell.kind === "stage" && cell.tableName}
                        · <span class="uppercase tracking-[.1em]"
                            >{cell.tableName}</span
                        >{/if}
                </div>
                <div class="font-medium">{cell.stage.Action}</div>
                {#if cell.kind === "stage" && cell.inPart && !compact}
                    <div class="text-muted text-xs">{cell.inPart}</div>
                {/if}
                {#if cell.stage.Hint && !compact}
                    <div class="text-muted text-xs">{cell.stage.Hint}</div>
                {/if}
                {#if cooking && cell.step === activeStep}
                    <div
                        class="absolute -inset-px pointer-events-none shadow-[inset_0_0_0_2px_#c2410c] bg-accent/[.09]"
                    ></div>
                {:else if cooking && cell.step < activeStep}
                    <div
                        class="absolute -inset-px pointer-events-none shadow-[inset_0_0_0_1px_rgba(194,65,12,.5)] bg-accent/[.03]"
                    ></div>
                {/if}
            </button>
        {:else if cell.kind === "dish"}
            <div
                class="border border-accent -mb-px bg-accent text-white flex flex-col {compact
                    ? 'justify-end p-2'
                    : ''}"
                style:grid-row={at.row}
                style:grid-column={at.col}
            >
                {#if !compact}
                    <img
                        src={imageUrl}
                        alt=""
                        class="w-full flex-1 min-h-[72px] object-cover block"
                        use:imageFallback
                    />
                    <div class="p-3.5 flex flex-col gap-2">
                        <div
                            class="text-[19px] font-bold leading-[1.1] tracking-[-.02em]"
                        >
                            {recipe.RecipeName}
                        </div>
                        <div class="font-mono text-[11px] leading-[1.5] opacity-85">
                            {servings}
                            {version.PortionDescriptor}<br />
                            {formatTime(totalTime)} · {layout.steps.length} steps
                        </div>
                    </div>
                {:else}
                    <span class="text-[13px] font-bold leading-[1.1]">
                        {recipe.RecipeName}
                    </span>
                {/if}
            </div>
        {/if}
    {/each}

    {#each layout.carries as carry (`${carry.row}-${carry.fromCol}`)}
        <div
            class="flex items-center"
            style:grid-row="{carry.row} / span {carry.rowSpan}"
            style:grid-column="{carry.fromCol + 1} / {carry.toCol + 1}"
        >
            <div class="w-full h-px bg-carry"></div>
        </div>
    {/each}
</div>
