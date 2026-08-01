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
</script>

<div class="bg-white flex-1">
    <div class="max-w-6xl mx-auto px-8 py-12">
        <!-- Page Header -->
        <div class="mb-12">
            <h1 class="text-3xl font-bold text-gray-800 tracking-tight mb-2">
                grocery list
            </h1>
            <p class="text-gray-600">your saved recipes and shopping list</p>
        </div>

        {#if cartItems.length === 0}
            <!-- Empty State -->
            <div class="text-center py-16">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                </div>
                <h2 class="text-xl font-medium text-gray-800 mb-2">
                    your grocery list is empty
                </h2>
                <p class="text-gray-600 mb-6">
                    add some recipes to get started
                </p>
                <a
                    href="/"
                    class="inline-flex items-center px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
                >
                    browse recipes
                </a>
            </div>
        {:else}
            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <!-- Recipes Section -->
                <div class="lg:col-span-2">
                    <div class="mb-8">
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight mb-6"
                        >
                            recipes ({cartItems.length})
                        </h2>
                        <div class="space-y-2">
                            {#each cartItems as item (item.recipe.RecipeID)}
                                <div
                                    class="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors duration-200"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <label
                                                    class="text-xs font-medium text-gray-500"
                                                    for={"qty-" +
                                                        item.recipe.RecipeID}
                                                    >qty</label
                                                >
                                                <input
                                                    id={"qty-" +
                                                        item.recipe.RecipeID}
                                                    type="number"
                                                    min="1"
                                                    bind:value={item.quantity}
                                                    on:change={() =>
                                                        updateRecipe(
                                                            item.recipe,
                                                            item.quantity,
                                                        )}
                                                    class="w-14 h-7 px-2 text-sm text-gray-700 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-gray-400 transition-colors duration-200"
                                                />
                                            </div>
                                            <div>
                                                <h3
                                                    class="font-medium text-gray-800"
                                                >
                                                    {item.recipe.RecipeName}
                                                </h3>
                                            </div>
                                        </div>
                                        <button
                                            on:click={() =>
                                                handleRemove(item.recipe)}
                                            class="px-3 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            remove
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Ingredients Section -->
                    <div>
                        <div class="flex items-center justify-between mb-6">
                            <h2
                                class="text-xl font-medium text-gray-800 tracking-tight"
                            >
                                shopping list ({cartIngredients.length} items)
                            </h2>
                            {#if mergeSource}
                                <button
                                    on:click={cancelMerge}
                                    class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    cancel merge
                                </button>
                            {/if}
                        </div>

                        {#if mergeSource}
                            <div
                                class="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
                            >
                                select another ingredient to merge <span
                                    class="font-semibold"
                                    >{mergeSource.ingredient
                                        .IngredientName}</span
                                > into
                            </div>
                        {/if}

                        <div
                            class="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100"
                        >
                            {#each cartIngredients as ingredient (ingredient.ingredient.IngredientID)}
                                {@const isSource =
                                    mergeSource?.ingredient.IngredientName ===
                                    ingredient.ingredient.IngredientName}
                                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                                <div
                                    class="p-4 flex justify-between items-center group transition-colors duration-150
                                    {mergeSource && !isSource
                                        ? 'cursor-pointer hover:bg-blue-50'
                                        : ''}
                                    {isSource ? 'bg-blue-50' : ''}"
                                    on:click={() => {
                                        if (mergeSource && !isSource)
                                            completeMerge(ingredient);
                                    }}
                                    on:keydown={(e) => {
                                        if (
                                            mergeSource &&
                                            !isSource &&
                                            (e.key === "Enter" || e.key === " ")
                                        )
                                            completeMerge(ingredient);
                                    }}
                                    role={mergeSource && !isSource
                                        ? "button"
                                        : undefined}
                                    tabindex={mergeSource && !isSource ? 0 : -1}
                                >
                                    <div class="flex items-center gap-3">
                                        {#if !mergeSource}
                                            <button
                                                on:click|stopPropagation={() =>
                                                    startMerge(ingredient)}
                                                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all duration-150"
                                                title="Merge with another ingredient"
                                                aria-label="Merge {ingredient
                                                    .ingredient
                                                    .IngredientName} with another ingredient"
                                            >
                                                <svg
                                                    class="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                                    />
                                                </svg>
                                            </button>
                                        {/if}
                                        <span class="text-gray-800 font-medium">
                                            {ingredient.ingredient
                                                .IngredientName}
                                        </span>
                                    </div>
                                    <span class="text-gray-600">
                                        {ingredient.quantity}
                                        {ingredient.measurement}
                                    </span>
                                </div>
                            {/each}
                        </div>

                        <!-- Merge rules -->
                        {#if Object.keys(mergeRules).length > 0}
                            <div class="mt-6">
                                <h3
                                    class="text-sm font-medium text-gray-500 mb-3"
                                >
                                    active merge rules
                                </h3>
                                <div class="space-y-2">
                                    {#each Object.entries(mergeRules) as [source, target] (source)}
                                        <div
                                            class="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg text-sm"
                                        >
                                            <span class="text-gray-600">
                                                <span class="text-gray-800"
                                                    >{source}</span
                                                >
                                                → {target}
                                            </span>
                                            <button
                                                on:click={() =>
                                                    undoMerge(source)}
                                                class="text-gray-400 hover:text-red-500 transition-colors duration-150"
                                                title="Remove merge rule"
                                                aria-label="Remove merge rule for {source}"
                                            >
                                                <svg
                                                    class="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- QR Code Sidebar -->
                <div class="lg:col-span-1">
                    <div class="sticky top-24">
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight mb-6"
                        >
                            quick access
                        </h2>
                        <div
                            class="bg-white border border-gray-200 rounded-lg p-6 text-center"
                        >
                            {#if list_url}
                                <div class="mb-4">
                                    <a
                                        href={list_url}
                                        target="_blank"
                                        class="block"
                                    >
                                        <div class="flex justify-center">
                                            <QRCodeImage
                                                bind:text={list_url}
                                                errorCorrectionLevel="M"
                                                displayType="canvas"
                                                width={200}
                                            />
                                        </div>
                                    </a>
                                </div>
                                <p class="text-sm text-gray-600 mb-4">
                                    scan to view your shopping list on mobile
                                </p>
                                <a
                                    href={list_url}
                                    target="_blank"
                                    class="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-md transition-colors duration-200"
                                >
                                    open list
                                </a>
                            {:else}
                                <div
                                    class="w-48 h-48 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-lg"
                                >
                                    <div class="text-gray-400">
                                        <svg
                                            class="w-12 h-12"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="1.5"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600">
                                    generating your shopping list...
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
