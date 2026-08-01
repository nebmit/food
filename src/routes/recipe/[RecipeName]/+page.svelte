<script lang="ts">
    import { setToCart } from "$lib/cart";
    import { parseInstructionScaled } from "$lib/parser";
    import { pageTitle } from "$lib/stores";
    import type {
        Instruction,
        Recipe,
        RecipeIngredient,
        RecipeItem,
    } from "$lib/types";
    import { getContext, onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import type { User } from "../../../app";

    export let data: { recipe: Recipe };
    const recipe = data.recipe;
    const recipeVersion = recipe.MainVersion;

    const ingredients: RecipeIngredient[] = recipeVersion.Ingredients;
    const pantryIngredients: RecipeIngredient[] =
        recipeVersion.PantryIngredients;
    const instructions: Instruction[] = recipeVersion.Instructions;
    const items: RecipeItem[] = recipeVersion.Items;
    const notes: string[] = recipeVersion.Notes;
    const description: string = recipeVersion.Description;

    const totalTime =
        recipeVersion.ActiveTimeMinutes + recipeVersion.PassiveTimeMinutes;

    const imageUrl =
        "/images/recipes/" + encodeURIComponent(recipe.RecipeName) + ".webp";

    pageTitle.set(recipe.RecipeName);
    onDestroy(() => pageTitle.set(null));

    const userStore = getContext<Writable<User>>("user");

    let user: User;
    userStore.subscribe((value: User) => {
        user = value;
    });

    let selectedPortion = recipeVersion.PortionQuantity;
    $: selectedPortion = Math.max(Math.min(selectedPortion, 99), 1);
    $: scalingFactor = selectedPortion / recipeVersion.PortionQuantity;

    function formatQuantity(quantity: number, factor: number): string {
        const scaled = quantity * factor;
        return scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
    }

    function incrementPortion() {
        if (selectedPortion < 99) selectedPortion++;
    }

    function decrementPortion() {
        if (selectedPortion > 1) selectedPortion--;
    }
</script>

<div class="recipe-page bg-white flex-1">
    <!-- Hero Image -->
    <div class="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <img
            class="absolute inset-0 w-full h-full object-cover"
            src={imageUrl}
            alt={recipe.RecipeName}
        />
        <div
            class="absolute inset-0"
            style="background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%);"
        ></div>

        <!-- Title overlay -->
        <div class="absolute inset-0 flex items-end">
            <div class="w-full max-w-5xl mx-auto px-5 pb-5 md:px-8 md:pb-6">
                <h1
                    class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight"
                >
                    {recipe.RecipeName}
                </h1>
            </div>
        </div>

        <!-- Add to Cart Button -->
        {#if user.isAuthenticated}
            <button
                class="absolute top-4 right-4 md:right-6 flex items-center gap-1.5 px-3.5 py-2 bg-white/95 text-gray-800 font-medium rounded-lg text-sm shadow-xs hover:bg-white active:scale-95 transition-all duration-150"
                on:click={() => setToCart(recipe, selectedPortion)}
            >
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                add to list
            </button>
        {/if}
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-5 md:px-8">
        <!-- Meta Strip -->
        <div
            class="flex items-center flex-wrap gap-x-4 gap-y-2 py-4 text-sm text-gray-500 border-b border-gray-100"
        >
            <div class="flex items-center gap-1.5">
                <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                    />
                </svg>
                <span>{totalTime} min</span>
                {#if recipeVersion.PassiveTimeMinutes > 0}
                    <span class="text-gray-300">
                        ({recipeVersion.ActiveTimeMinutes} active)
                    </span>
                {/if}
            </div>

            {#if recipeVersion.ComplexityRating || recipeVersion.MayhemRating}
                <div class="flex items-center gap-4">
                    {#if recipeVersion.ComplexityRating}
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-400">complexity</span>
                            <div class="flex gap-0.5">
                                {#each Array(5).keys() as i (i)}
                                    <div
                                        class="w-2 h-2 rounded-full {i <
                                        recipeVersion.ComplexityRating
                                            ? 'bg-amber-400'
                                            : 'bg-gray-200'}"
                                    ></div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    {#if recipeVersion.MayhemRating}
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-400">mayhem</span>
                            <div class="flex gap-0.5">
                                {#each Array(5).keys() as i (i)}
                                    <div
                                        class="w-2 h-2 rounded-full {i <
                                        recipeVersion.MayhemRating
                                            ? 'bg-red-400'
                                            : 'bg-gray-200'}"
                                    ></div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        {#if description}
            <p class="text-gray-500 text-sm leading-relaxed pt-4">
                {description}
            </p>
        {/if}

        <!-- Portion Selector -->
        <div class="flex items-center gap-3 py-5">
            <span
                class="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
                servings
            </span>
            <div class="flex items-center">
                <button
                    on:click={decrementPortion}
                    class="w-9 h-9 flex items-center justify-center rounded-l-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors select-none"
                    aria-label="Decrease servings"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M20 12H4"
                        />
                    </svg>
                </button>
                <input
                    bind:value={selectedPortion}
                    type="number"
                    class="w-12 h-9 text-center text-sm font-semibold text-gray-800 border-y border-gray-200 bg-white focus:outline-hidden appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    min="1"
                    max="99"
                />
                <button
                    on:click={incrementPortion}
                    class="w-9 h-9 flex items-center justify-center rounded-r-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors select-none"
                    aria-label="Increase servings"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
            </div>
            <span class="text-sm text-gray-500">
                {recipeVersion.PortionDescriptor}
            </span>
        </div>

        <!-- Two-column grid on large screens -->
        <div class="grid grid-cols-1 lg:grid-cols-12 lg:gap-12">
            <!-- Sidebar: Ingredients, Pantry, Equipment -->
            <div class="lg:col-span-4">
                <!-- Ingredients -->
                <section class="pb-8">
                    <h2
                        class="text-sm font-semibold text-gray-800 tracking-tight mb-4"
                    >
                        ingredients
                    </h2>
                    <ul class="divide-y divide-gray-100">
                        {#each ingredients as ingredient (ingredient.RecipeVersionIngredientID)}
                            <li
                                class="flex justify-between items-baseline py-2.5"
                            >
                                <div class="flex flex-col min-w-0 pr-4">
                                    <span class="text-gray-800">
                                        {ingredient.Ingredient.IngredientName}
                                    </span>
                                    {#if ingredient.Prep}
                                        <span
                                            class="text-xs text-gray-400 mt-0.5"
                                        >
                                            {ingredient.Prep}
                                        </span>
                                    {/if}
                                    {#if ingredient.Sub}
                                        <span
                                            class="text-xs text-gray-400 italic mt-0.5"
                                        >
                                            {ingredient.Sub}
                                        </span>
                                    {/if}
                                </div>
                                <span
                                    class="text-sm text-gray-500 font-medium whitespace-nowrap tabular-nums"
                                >
                                    {formatQuantity(
                                        ingredient.Quantity,
                                        scalingFactor,
                                    )}
                                    {ingredient.Measurement || ""}
                                </span>
                            </li>
                        {/each}
                    </ul>

                    <!-- Pantry Staples -->
                    {#if pantryIngredients.length > 0}
                        <div class="mt-5">
                            <h3
                                class="text-xs font-medium text-gray-500 tracking-tight mb-2"
                            >
                                pantry staples
                            </h3>
                            <div class="flex flex-wrap gap-1.5">
                                {#each pantryIngredients as pantry (pantry.RecipeVersionIngredientID)}
                                    <span
                                        class="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
                                    >
                                        {pantry.Ingredient.IngredientName}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </section>

                <!-- Equipment -->
                {#if items.length > 0}
                    <section class="pb-8">
                        <h2
                            class="text-sm font-semibold text-gray-800 tracking-tight mb-4"
                        >
                            equipment
                        </h2>
                        <div class="flex flex-wrap gap-2">
                            {#each items as item (item.RecipeVersionItemID)}
                                <span
                                    class="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full"
                                >
                                    {item.Item.ItemName}
                                    {#if item.Quantity > 1}
                                        <span class="text-gray-400 text-xs"
                                            >×{item.Quantity}</span
                                        >
                                    {/if}
                                </span>
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>

            <!-- Main: Instructions, Notes -->
            <div class="lg:col-span-8">
                <!-- Instructions -->
                <section class="pb-8">
                    <h2
                        class="text-sm font-semibold text-gray-800 tracking-tight mb-4"
                    >
                        instructions
                    </h2>
                    <ol class="space-y-5">
                        {#each instructions as instruction (instruction.InstructionID)}
                            <li class="flex gap-4">
                                <span
                                    class="shrink-0 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold"
                                >
                                    {instruction.StepNumber}
                                </span>
                                <p
                                    class="flex-1 text-gray-700 leading-relaxed pt-1"
                                >
                                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                                    {@html parseInstructionScaled(
                                        instruction.StepDetail,
                                        ingredients,
                                        scalingFactor,
                                    )}
                                </p>
                            </li>
                        {/each}
                    </ol>
                </section>

                <!-- Notes -->
                {#if notes.length > 0}
                    <section class="pb-10">
                        <h2
                            class="text-sm font-semibold text-gray-800 tracking-tight mb-4"
                        >
                            notes
                        </h2>
                        <div class="space-y-3">
                            {#each notes as noteText, noteIndex (noteIndex)}
                                <div class="pl-4 border-l-2 border-gray-200">
                                    <p
                                        class="text-gray-600 text-sm leading-relaxed"
                                    >
                                        {noteText}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>
        </div>
    </div>
</div>
