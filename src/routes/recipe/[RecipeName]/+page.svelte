<script lang="ts">
    import { setToCart } from "$lib/cart";
    import { cookSteps } from "$lib/cookStep";
    import { layoutRecipe } from "$lib/cookingTable";
    import { createCookTimers, viewOf } from "$lib/cookTimers";
    import { formatAmount, formatMeasure, formatTimes, padStep, rating } from "$lib/format";
    import CookingGrid from "$lib/fragments/cookingGrid.svelte";
    import CookScreen from "$lib/fragments/cookScreen.svelte";
    import { imageFallback } from "$lib/imageFallback";
    import { aggregateIngredients } from "$lib/recipeIngredients";
    import { pageTitle } from "$lib/stores";
    import type { Recipe } from "$lib/types";
    import { getContext, onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import type { User } from "../../../app";

    export let data: { recipe: Recipe };

    $: recipe = data.recipe;
    $: recipeVersion = recipe.MainVersion;
    $: layout = layoutRecipe(recipeVersion);
    $: ingredients = aggregateIngredients(recipeVersion);
    $: stepCount = layout.steps.length;
    $: imageUrl =
        "/images/recipes/" + encodeURIComponent(recipe.RecipeName) + ".webp";

    $: pageTitle.set(recipe.RecipeName);
    onDestroy(() => pageTitle.set(null));

    const userStore = getContext<Writable<User>>("user");
    let user: User;
    userStore.subscribe((value: User) => {
        user = value;
    });

    // Servings
    let selectedPortion = 1;
    $: selectedPortion = recipeVersion.PortionQuantity;
    $: scalingFactor = selectedPortion / recipeVersion.PortionQuantity;

    function incrementPortion() {
        if (selectedPortion < 99) selectedPortion++;
    }

    function decrementPortion() {
        if (selectedPortion > 1) selectedPortion--;
    }

    // Cook mode: one block at a time, in document order.
    let cooking = false;
    let step = 0;
    /** The mobile full-screen cook surface; the desktop cooks in the grid itself. */
    let cookScreenOpen = false;
    const timers = createCookTimers();
    $: if (recipe) {
        cooking = false;
        step = 0;
        cookScreenOpen = false;
    }
    onDestroy(() => {
        timers.stop();
    });

    $: steps = cookSteps(layout);
    $: current = cooking ? steps[step - 1] : undefined;
    $: currentTimer = current ? $timers.get(current.step) : undefined;

    function toggleCook() {
        cooking = !cooking;
        step = cooking ? 1 : 0;
    }

    function prevStep() {
        step = Math.max(1, step - 1);
        cooking = true;
    }

    function nextStep() {
        step = Math.min(stepCount, (step || 0) + 1);
        cooking = true;
    }

    /** Tapping a block on the mobile map opens the cook screen there. */
    function pick(event: CustomEvent<number>) {
        cooking = true;
        step = event.detail;
    }

    function pickMobile(event: CustomEvent<number>) {
        pick(event);
        cookScreenOpen = true;
    }

    function startCooking() {
        cooking = true;
        step = 1;
        cookScreenOpen = true;
    }

    function closeCookScreen() {
        cookScreenOpen = false;
        cooking = false;
        step = 0;
    }

    function onKeydown(event: KeyboardEvent) {
        if (cookScreenOpen || event.isComposing || event.metaKey || event.ctrlKey) return;
        const target = event.target as HTMLElement | null;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

        if (event.key === "ArrowRight") {
            event.preventDefault();
            nextStep();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            prevStep();
        } else if (event.key === "Escape" && cooking) {
            cooking = false;
            step = 0;
        }
    }

    $: cookLabel = cooking ? "Exit cook mode" : "Cook mode";
    $: stepLabel = cooking ? `Step ${step} / ${stepCount}` : `— / ${stepCount}`;

    function ingredientAmount(entry: (typeof ingredients)[number]): string {
        if (entry.quantity !== undefined && entry.measurement !== undefined) {
            return formatMeasure(entry.quantity, entry.measurement, scalingFactor);
        }
        return entry.hints.join("; ");
    }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- ===================== Desktop ===================== -->
<div class="hidden md:block flex-1">
    <!-- Title block -->
    <div
        class="px-10 pt-[26px] pb-5 grid grid-cols-[1fr_auto] gap-10 items-end border-b border-rule"
    >
        <div>
            <h1 class="text-[40px] leading-none tracking-[-.03em] font-bold mb-2.5">
                {recipe.RecipeName}
            </h1>
            {#if recipeVersion.Description}
                <p class="text-[15px] leading-[1.45] text-body max-w-[60ch] mb-3">
                    {recipeVersion.Description}
                </p>
            {/if}
            <div
                class="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10px] leading-none tracking-[.1em] uppercase text-muted-3"
            >
                {#if recipeVersion.Cuisine}<span>{recipeVersion.Cuisine}</span>{/if}
                {#if recipeVersion.Source}<span>{recipeVersion.Source}</span>{/if}
                <span>{formatTimes(recipeVersion)}</span>
                <span
                    >Complexity <span class="text-ink tracking-[.18em]"
                        >{rating(recipeVersion.ComplexityRating)}</span
                    ></span
                >
                <span
                    >Mayhem <span class="text-ink tracking-[.18em]"
                        >{rating(recipeVersion.MayhemRating)}</span
                    ></span
                >
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
                >Servings</span
            >
            <div class="flex items-center border border-ink">
                <button
                    on:click={decrementPortion}
                    class="w-8 h-8 border-r border-ink bg-white text-base hover:bg-hover"
                    aria-label="Decrease servings">−</button
                >
                <div
                    class="w-[46px] h-8 flex items-center justify-center text-[15px] font-bold tabular-nums"
                >
                    {selectedPortion}
                </div>
                <button
                    on:click={incrementPortion}
                    class="w-8 h-8 border-l border-ink bg-white text-base hover:bg-hover"
                    aria-label="Increase servings">+</button
                >
            </div>
            {#if user.isAuthenticated}
                <button
                    on:click={() => setToCart(recipe, selectedPortion)}
                    class="border border-ink bg-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent hover:text-white"
                >
                    Add to groceries
                </button>
            {/if}
        </div>
    </div>

    <!-- Cook-mode bar -->
    <div class="px-10 py-3 border-b border-rule bg-paper">
        <div class="flex items-center justify-between gap-6">
            <div class="flex items-center gap-3.5 min-w-0">
                <button
                    on:click={toggleCook}
                    class="shrink-0 border border-ink bg-ink text-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent"
                >
                    {cookLabel}
                </button>
                {#if current}
                    <div class="flex items-baseline gap-2.5 min-w-0">
                        <span
                            class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-accent whitespace-nowrap"
                        >
                            {padStep(current.step)} · {current.where}
                        </span>
                        <span class="text-[15px] font-medium whitespace-nowrap"
                            >{current.stage.Action}</span
                        >
                        {#if current.stage.Hint}
                            <span class="text-[13px] text-muted truncate"
                                >{current.stage.Hint}</span
                            >
                        {/if}
                    </div>
                {:else}
                    <span class="text-[13px] text-muted"
                        >Step through one block at a time. Use ← and →.</span
                    >
                {/if}
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button
                    on:click={prevStep}
                    class="border border-ink bg-white text-[13px] w-8 h-8 hover:bg-hover"
                    aria-label="Previous step">←</button
                >
                <span
                    class="font-mono text-[10px] leading-none tracking-[.1em] text-muted min-w-[72px] text-center"
                    >{stepLabel}</span
                >
                <button
                    on:click={nextStep}
                    class="border border-ink bg-white text-[13px] w-8 h-8 hover:bg-hover"
                    aria-label="Next step">→</button
                >
            </div>
        </div>

        {#if current}
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2.5">
                {#if current.adds.length}
                    <span
                        class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
                        >Goes in now</span
                    >
                    {#each current.adds as add (add.RecipeStageInputID)}
                        <span
                            class="border border-accent bg-accent/[.07] text-[13px] px-2.5 py-1.5 leading-none"
                        >
                            {add.Ingredient.IngredientName}
                            <span class="text-muted tabular-nums"
                                >{formatAmount(add, scalingFactor)}</span
                            >
                        </span>
                    {/each}
                {:else}
                    <span
                        class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
                        >Nothing new goes in</span
                    >
                {/if}

                {#each current.from as source (source.step)}
                    <button
                        on:click={() => (step = source.step)}
                        class="border border-rule bg-white font-mono text-[10px] leading-none tracking-[.1em] uppercase text-muted px-2.5 py-1.5 hover:border-ink"
                    >
                        {source.label}
                    </button>
                {/each}

                {#if current.durationMinutes}
                    {@const view = currentTimer ? viewOf(currentTimer) : null}
                    <button
                        on:click={() =>
                            timers.toggle(current.step, current.durationMinutes ?? 0)}
                        class="border px-2.5 py-1.5 font-mono text-[11px] leading-none tabular-nums {view?.finished
                            ? 'border-accent bg-accent text-white'
                            : 'border-accent text-accent'}"
                    >
                        {view
                            ? `${view.clock}${view.running ? "" : view.finished ? " ready" : " paused"}`
                            : `Start ${current.durationMinutes} min timer`}
                    </button>
                    {#if currentTimer}
                        <button
                            on:click={() => timers.extend(current.step, 2)}
                            class="border border-rule bg-white font-mono text-[10px] leading-none tracking-[.1em] uppercase text-muted px-2.5 py-1.5 hover:border-ink"
                            >+2 min</button
                        >
                    {/if}
                {/if}
            </div>
        {/if}
    </div>

    <!-- The grid -->
    <div class="px-10 pt-[30px] pb-[34px] overflow-x-auto">
        <CookingGrid
            {layout}
            {recipe}
            {scalingFactor}
            servings={selectedPortion}
            {cooking}
            activeStep={step}
            on:pick={pick}
        />
    </div>

    <!-- Equipment · Ingredients · Notes -->
    <div class="grid grid-cols-[1fr_1fr_1.4fr] border-t border-ink">
        <div class="pt-[22px] pb-7 pl-10 pr-8">
            <h3
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mb-3"
            >
                Equipment
            </h3>
            <div class="flex flex-col gap-1.5 text-sm text-text-2">
                {#each recipeVersion.Items as item (item.RecipeVersionItemID)}
                    <span>
                        {item.Item.ItemName}
                        {#if item.Quantity > 1}<span class="text-muted-2"
                                >×{item.Quantity}</span
                            >{/if}
                        {#if item.Sub}<span class="text-muted-2">{item.Sub}</span
                            >{/if}
                    </span>
                {:else}
                    <span class="text-muted-2">—</span>
                {/each}
            </div>
        </div>
        <div class="pt-[22px] pb-7 pr-8">
            <h3
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mb-3"
            >
                Ingredients
            </h3>
            <div class="flex flex-col gap-1.5 text-sm text-text-2">
                {#each ingredients as entry (entry.ingredient.IngredientName + (entry.measurement ?? ""))}
                    <span>
                        {entry.ingredient.IngredientName}
                        <span class="text-muted-2 tabular-nums"
                            >{ingredientAmount(entry)}</span
                        >
                    </span>
                {/each}
            </div>
        </div>
        <div class="pt-[22px] pb-7 pr-10">
            <h3
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mb-3"
            >
                Notes
            </h3>
            <div
                class="flex flex-col gap-2 text-sm leading-[1.45] text-text-2 max-w-[56ch]"
            >
                {#each recipeVersion.Notes as note, index (index)}
                    <span>{note}</span>
                {:else}
                    <span class="text-muted-2">—</span>
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- ===================== Mobile ===================== -->
<div class="md:hidden flex-1 pb-24">
    <div class="flex items-center justify-between px-5 py-3 border-b border-ink">
        <a href="/" class="font-mono text-[11px] leading-none tracking-[.1em] uppercase"
            >← Index</a
        >
        <span class="font-mono text-[10px] leading-none tracking-[.1em] text-muted-3"
            >recipe.yaml</span
        >
    </div>

    <img
        src={imageUrl}
        alt={recipe.RecipeName}
        class="w-full h-[172px] object-cover block bg-canvas"
        use:imageFallback
    />

    <div class="px-5 pt-[18px] pb-4 border-b border-ink">
        <h1 class="text-[28px] leading-[1.02] tracking-[-.03em] font-bold mb-2">
            {recipe.RecipeName}
        </h1>
        {#if recipeVersion.Description}
            <p class="text-[15px] leading-[1.45] text-body mb-3">
                {recipeVersion.Description}
            </p>
        {/if}
        <div
            class="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10px] leading-[1.4] tracking-[.1em] uppercase text-muted-3"
        >
            {#if recipeVersion.Cuisine}<span>{recipeVersion.Cuisine}</span>{/if}
            <span>{formatTimes(recipeVersion)}</span>
            <span>{stepCount} steps</span>
            <span
                >Complexity <span class="text-ink tracking-[.18em]"
                    >{rating(recipeVersion.ComplexityRating)}</span
                ></span
            >
            <span
                >Mayhem <span class="text-ink tracking-[.18em]"
                    >{rating(recipeVersion.MayhemRating)}</span
                ></span
            >
        </div>
    </div>

    <div
        class="px-5 py-3.5 flex items-center justify-between border-b border-ink bg-paper"
    >
        <span
            class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted"
            >Servings</span
        >
        <div class="flex items-center border border-ink">
            <button
                on:click={decrementPortion}
                class="w-12 h-11 border-r border-ink bg-white text-[19px]"
                aria-label="Decrease servings">−</button
            >
            <div
                class="w-[52px] h-11 flex items-center justify-center text-[17px] font-bold tabular-nums"
            >
                {selectedPortion}
            </div>
            <button
                on:click={incrementPortion}
                class="w-12 h-11 border-l border-ink bg-white text-[19px]"
                aria-label="Increase servings">+</button
            >
        </div>
    </div>
    {#if user.isAuthenticated}
        <div class="px-5 pt-3">
            <button
                on:click={() => setToCart(recipe, selectedPortion)}
                class="w-full h-11 border border-ink bg-white font-mono text-[11px] tracking-[.14em] uppercase"
            >
                Add to groceries
            </button>
        </div>
    {/if}

    <div class="px-5 pt-[18px] pb-1 flex items-baseline justify-between">
        <h2
            class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
        >
            Ingredients
        </h2>
    </div>
    <div class="px-5 pt-2.5 pb-1 flex flex-col">
        {#each ingredients as entry (entry.ingredient.IngredientName + (entry.measurement ?? ""))}
            <div
                class="grid grid-cols-[1fr_auto] gap-3 items-center min-h-12 border-b border-rule"
            >
                <span class="flex flex-col gap-0.5 min-w-0">
                    <span class="text-[15px] leading-[1.2]"
                        >{entry.ingredient.IngredientName}</span
                    >
                    {#if entry.quantity !== undefined && entry.hints.length}
                        <span class="text-[11px] text-muted-2"
                            >{entry.hints.join("; ")}</span
                        >
                    {/if}
                </span>
                <span class="text-sm text-muted tabular-nums whitespace-nowrap"
                    >{ingredientAmount(entry)}</span
                >
            </div>
        {/each}
    </div>

    <div class="px-5 pt-5 pb-1 flex items-baseline justify-between" id="map">
        <h2
            class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
        >
            The map
        </h2>
        <span class="font-mono text-[10px] leading-none text-muted-4">swipe →</span>
    </div>
    <div class="pl-5 pt-2.5 overflow-x-auto">
        <div class="min-w-[640px] pr-5">
            <CookingGrid
                {layout}
                {recipe}
                {scalingFactor}
                servings={selectedPortion}
                {cooking}
                activeStep={step}
                compact
                on:pick={pickMobile}
            />
        </div>
    </div>

    {#if recipeVersion.Items.length}
        <div class="px-5 pt-6">
            <h2
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mb-3"
            >
                Equipment
            </h2>
            <div class="flex flex-col gap-1.5 text-sm text-text-2">
                {#each recipeVersion.Items as item (item.RecipeVersionItemID)}
                    <span>
                        {item.Item.ItemName}
                        {#if item.Quantity > 1}<span class="text-muted-2"
                                >×{item.Quantity}</span
                            >{/if}
                        {#if item.Sub}<span class="text-muted-2">{item.Sub}</span
                            >{/if}
                    </span>
                {/each}
            </div>
        </div>
    {/if}

    {#if recipeVersion.Notes.length}
        <div class="px-5 pt-6">
            <h2
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mb-3"
            >
                Notes
            </h2>
            <div class="flex flex-col gap-2 text-sm leading-[1.45] text-text-2">
                {#each recipeVersion.Notes as note, index (index)}
                    <span>{note}</span>
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- Mobile sticky action bar -->
<div
    class="md:hidden fixed inset-x-0 bottom-0 bg-white border-t border-ink px-5 pt-3 pb-5 z-30"
>
    <button
        on:click={startCooking}
        class="w-full h-[54px] border border-ink bg-ink text-white font-mono text-xs tracking-[.16em] uppercase"
    >
        {cooking ? `Resume · step ${step} / ${stepCount}` : `Start cooking · ${stepCount} steps`}
    </button>
</div>

<!-- Mobile cook mode: a screen of its own, not the map behind a control bar. -->
{#if cookScreenOpen}
    <CookScreen
        {layout}
        {recipe}
        {scalingFactor}
        servings={selectedPortion}
        {timers}
        bind:step
        on:close={closeCookScreen}
    />
{/if}
