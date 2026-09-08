<script lang="ts">
    import { deserialize } from "$app/forms";
    import {
        addMergeRule,
        getCart,
        getCartIngredients,
        getMergeRules,
        removeMergeRule,
        setToCart,
    } from "$lib/cart";
    import { formatMeasure } from "$lib/format";
    import type { CartIngredient, Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { QRCodeImage } from "svelte-qrcode-image";

    let list_url: string | null = null;

    let cartItems: { recipe: Recipe; quantity: number }[] = [];
    let cartIngredients: CartIngredient[] = [];

    /** The ingredient the user picked as the merge source. */
    let mergeSource: CartIngredient | null = null;
    let mergeRules: Record<string, string> = {};

    onMount(async () => {
        loadCart();
        mergeRules = getMergeRules();
    });

    let timeout: number | null = null;
    async function loadCart() {
        cartItems = getCart();
        cartIngredients = getCartIngredients();

        if (cartItems.length === 0) {
            list_url = null;
            return;
        }

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(createList, 500) as unknown as number;
    }

    async function createList() {
        const formData = new FormData();
        formData.append("ingredients", JSON.stringify(cartIngredients));
        try {
            const response = await fetch("?/createCart", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.text();

            const result = deserialize(data);
            if (result.type === "success" && result.data) {
                list_url = (result.data.url as string) || null;
            } else {
                console.error("There was a problem with the server:", result);
            }
        } catch (e: unknown) {
            console.error("There was a problem with the fetch operation:", e);
        }
    }

    function handleRemove(recipe: Recipe) {
        setToCart(recipe, -1);
        loadCart();
    }

    function updateRecipe(recipe: Recipe, quantity: number) {
        setToCart(recipe, quantity);
        loadCart();
    }

    function startMerge(ingredient: CartIngredient) {
        mergeSource = ingredient;
    }

    function cancelMerge() {
        mergeSource = null;
    }

    function completeMerge(target: CartIngredient) {
        if (!mergeSource) return;
        addMergeRule(
            mergeSource.ingredient.IngredientName,
            target.ingredient.IngredientName,
        );
        mergeSource = null;
        mergeRules = getMergeRules();
        loadCart();
    }

    function undoMerge(source: string) {
        removeMergeRule(source);
        mergeRules = getMergeRules();
        loadCart();
    }

    function amount(ingredient: CartIngredient): string {
        if (ingredient.quantity > 0 && ingredient.measurement) {
            return formatMeasure(ingredient.quantity, ingredient.measurement);
        }
        return "";
    }
</script>

<div class="flex-1 px-5 md:px-10 pt-[26px] pb-10">
    <!-- Page header -->
    <div class="pb-5 border-b border-rule flex items-baseline gap-[14px] flex-wrap">
        <h1 class="text-[34px] leading-none tracking-[-.03em] font-bold">
            Groceries
        </h1>
        <span class="text-sm text-muted">
            {cartItems.length}
            {cartItems.length === 1 ? "recipe" : "recipes"} · {cartIngredients.length}
            items
        </span>
    </div>

    {#if cartItems.length === 0}
        <!-- Empty state -->
        <div class="py-16 flex flex-col items-start gap-4">
            <p class="text-[15px] text-muted max-w-[48ch]">
                Nothing on the list yet. Open a recipe, pick the servings and add it
                here.
            </p>
            <a
                href="/"
                class="border border-ink bg-ink text-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent"
            >
                Browse recipes
            </a>
        </div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-x-10 gap-y-8 pt-6">
            <!-- Recipes -->
            <section>
                <h2
                    class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 pb-2.5 border-b border-ink"
                >
                    Recipes
                </h2>
                {#each cartItems as item (item.recipe.RecipeID)}
                    <div
                        class="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-2.5 border-b border-rule"
                    >
                        <div class="flex items-center border border-ink">
                            <label class="sr-only" for={"qty-" + item.recipe.RecipeID}
                                >Servings</label
                            >
                            <input
                                id={"qty-" + item.recipe.RecipeID}
                                type="number"
                                min="1"
                                bind:value={item.quantity}
                                on:change={() =>
                                    updateRecipe(item.recipe, item.quantity)}
                                class="w-14 h-8 text-center text-sm font-bold tabular-nums bg-white outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                        </div>
                        <a
                            href={"/recipe/" + encodeURIComponent(item.recipe.RecipeName)}
                            class="text-[15px] font-medium hover:text-accent truncate"
                        >
                            {item.recipe.RecipeName}
                            <span class="font-mono text-[10px] text-muted-3 ml-1"
                                >{item.recipe.MainVersion.PortionDescriptor}</span
                            >
                        </a>
                        <button
                            on:click={() => handleRemove(item.recipe)}
                            class="font-mono text-[10px] leading-none tracking-[.12em] uppercase text-muted-3 hover:text-accent"
                        >
                            remove
                        </button>
                    </div>
                {/each}
            </section>

            <!-- Shopping list -->
            <section>
                <div class="flex items-baseline justify-between pb-2.5 border-b border-ink">
                    <h2
                        class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
                    >
                        Shopping list
                    </h2>
                    {#if mergeSource}
                        <button
                            on:click={cancelMerge}
                            class="font-mono text-[10px] leading-none tracking-[.12em] uppercase text-accent hover:text-ink"
                        >
                            cancel merge ×
                        </button>
                    {/if}
                </div>

                {#if mergeSource}
                    <div class="mt-3 px-3 py-2.5 bg-paper border border-rule text-[13px] text-muted">
                        Pick the ingredient to fold
                        <span class="text-ink font-medium"
                            >{mergeSource.ingredient.IngredientName}</span
                        > into.
                    </div>
                {/if}

                <div>
                    {#each cartIngredients as ingredient (ingredient.ingredient.IngredientName + "-" + ingredient.measurement)}
                        {@const isSource =
                            mergeSource?.ingredient.IngredientName ===
                            ingredient.ingredient.IngredientName}
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                        <div
                            class="group flex justify-between items-center gap-3 py-2.5 border-b border-rule
                            {mergeSource && !isSource
                                ? 'cursor-pointer hover:bg-row-hover hover:text-accent'
                                : ''}
                            {isSource ? 'bg-paper' : ''}"
                            on:click={() => {
                                if (mergeSource && !isSource) completeMerge(ingredient);
                            }}
                            on:keydown={(e) => {
                                if (
                                    mergeSource &&
                                    !isSource &&
                                    (e.key === "Enter" || e.key === " ")
                                )
                                    completeMerge(ingredient);
                            }}
                            role={mergeSource && !isSource ? "button" : undefined}
                            tabindex={mergeSource && !isSource ? 0 : -1}
                        >
                            <div class="flex items-center gap-2 min-w-0">
                                {#if !mergeSource}
                                    <button
                                        on:click|stopPropagation={() =>
                                            startMerge(ingredient)}
                                        class="opacity-0 group-hover:opacity-100 font-mono text-[10px] leading-none tracking-[.12em] uppercase text-muted-3 hover:text-accent"
                                        title="Merge with another ingredient"
                                        aria-label="Merge {ingredient.ingredient
                                            .IngredientName} with another ingredient"
                                    >
                                        merge
                                    </button>
                                {/if}
                                <span class="text-[15px] truncate">
                                    {ingredient.ingredient.IngredientName}
                                </span>
                            </div>
                            <span class="text-sm text-muted tabular-nums whitespace-nowrap">
                                {amount(ingredient)}
                            </span>
                        </div>
                    {/each}
                </div>

                <!-- Merge rules -->
                {#if Object.keys(mergeRules).length > 0}
                    <div class="mt-6">
                        <h3
                            class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 pb-2.5 border-b border-ink"
                        >
                            Merge rules
                        </h3>
                        {#each Object.entries(mergeRules) as [source, target] (source)}
                            <div
                                class="flex items-center justify-between gap-3 py-2.5 border-b border-rule text-sm"
                            >
                                <span class="text-muted">
                                    <span class="text-ink">{source}</span>
                                    → {target}
                                </span>
                                <button
                                    on:click={() => undoMerge(source)}
                                    class="font-mono text-[10px] leading-none tracking-[.12em] uppercase text-muted-3 hover:text-accent"
                                    title="Remove merge rule"
                                    aria-label="Remove merge rule for {source}"
                                >
                                    undo
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- Share -->
            <section>
                <h2
                    class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 pb-2.5 border-b border-ink"
                >
                    On your phone
                </h2>
                <div class="pt-4 flex flex-col items-start gap-4">
                    {#if list_url}
                        <a href={list_url} target="_blank" class="block border border-ink p-3">
                            <QRCodeImage
                                bind:text={list_url}
                                errorCorrectionLevel="M"
                                displayType="canvas"
                                width={200}
                            />
                        </a>
                        <p class="text-[13px] text-muted max-w-[28ch]">
                            Scan to open the list on your phone. Links expire after a week.
                        </p>
                        <a
                            href={list_url}
                            target="_blank"
                            class="border border-ink bg-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent hover:text-white"
                        >
                            Open list
                        </a>
                    {:else}
                        <div
                            class="w-[226px] h-[226px] border border-rule bg-paper flex items-center justify-center font-mono text-[10px] tracking-[.12em] uppercase text-muted-3"
                        >
                            generating…
                        </div>
                    {/if}
                </div>
            </section>
        </div>
    {/if}
</div>
