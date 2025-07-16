<script lang="ts">
    import { stars } from "$lib/actions";
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
    const instructions: Instruction[] = recipeVersion.Instructions;
    const items: RecipeItem[] = recipeVersion.Items;
    const note: string | undefined = recipeVersion.VersionComment;

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
</script>

<div class="bg-white flex-1">
    <!-- Hero Section -->
    <div class="relative h-48 md:h-56 mb-6">
        <img
            class="absolute inset-0 w-full h-full object-cover"
            src={imageUrl}
            alt={recipe.RecipeName}
        />
        <div class="absolute inset-0 bg-black/40"></div>

        <!-- Recipe Title -->
        <div class="absolute inset-0 flex items-end">
            <div class="w-full max-w-6xl mx-auto p-4 md:p-6 lg:px-8">
                <h1
                    class="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-1"
                    style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);"
                >
                    {recipe.RecipeName}
                </h1>

                <!-- Quick Info Bar -->
                <div
                    class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-white text-sm"
                    style="text-shadow: 1px 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5);"
                >
                    <div class="flex items-center gap-3">
                        <span
                            >{selectedPortion}
                            {recipeVersion.PortionDescriptor}</span
                        >
                        <span>•</span>
                        <span
                            >{recipeVersion.ActiveTimeMinutes +
                                recipeVersion.PassiveTimeMinutes} min</span
                        >
                    </div>
                    {#if recipeVersion.ComplexityRating || recipeVersion.MayhemRating}
                        <div class="flex items-center gap-3">
                            {#if recipeVersion.ComplexityRating}
                                <div class="flex items-center gap-1">
                                    <span>complexity</span>
                                    <div class="flex gap-0.5">
                                        {#each Array(5) as _, i}
                                            <div
                                                class="w-1.5 h-1.5 rounded-full {i <
                                                recipeVersion.ComplexityRating
                                                    ? 'bg-yellow-400'
                                                    : 'bg-white/40'}"
                                                style="filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.7));"
                                            ></div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            {#if recipeVersion.MayhemRating}
                                {#if recipeVersion.ComplexityRating}
                                    <span>•</span>
                                {/if}
                                <div class="flex items-center gap-1">
                                    <span>mayhem</span>
                                    <div class="flex gap-0.5">
                                        {#each Array(5) as _, i}
                                            <div
                                                class="w-1.5 h-1.5 rounded-full {i <
                                                recipeVersion.MayhemRating
                                                    ? 'bg-red-400'
                                                    : 'bg-white/40'}"
                                                style="filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.7));"
                                            ></div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Add to Cart Button -->
        {#if !user.isAuthenticated}
            <div
                class="absolute top-3 right-0 w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pointer-events-none"
            >
                <div class="flex justify-end pointer-events-auto">
                    <button
                        class="px-3 py-1.5 bg-white/90 text-gray-800 font-medium rounded text-sm hover:bg-white transition-colors duration-200"
                        on:click={() => setToCart(recipe, selectedPortion)}
                    >
                        add to pantry
                    </button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-6 md:px-8 pb-12">
        <!-- Portion Selector -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-4">
                <label for="servings" class="text-sm font-medium text-gray-600"
                    >servings</label
                >
                <input
                    id="servings"
                    bind:value={selectedPortion}
                    type="number"
                    class="w-16 h-8 px-2 text-sm text-gray-700 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors duration-200 text-center"
                    min="1"
                    max="99"
                />
                <span class="text-sm text-gray-600"
                    >{recipeVersion.PortionDescriptor}</span
                >
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <!-- Instructions (shown first on mobile) -->
            <div class="lg:col-span-3 lg:order-2">
                <h2 class="text-lg font-bold text-gray-800 tracking-tight mb-4">
                    instructions
                </h2>
                <div class="space-y-4">
                    {#each instructions as instruction}
                        <div class="flex gap-3">
                            <div
                                class="flex-shrink-0 w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold"
                            >
                                {instruction.StepNumber}
                            </div>
                            <div class="flex-1 pt-0.5">
                                <p class="text-gray-700 leading-relaxed">
                                    {parseInstructionScaled(
                                        instruction.StepDetail,
                                        ingredients,
                                        scalingFactor,
                                    )}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Ingredients & Items (shown second on mobile) -->
            <div class="lg:col-span-2 lg:order-1 space-y-4">
                <!-- Ingredients -->
                <div>
                    <h2
                        class="text-lg font-bold text-gray-800 tracking-tight mb-3"
                    >
                        ingredients
                    </h2>
                    <div class="space-y-1.5">
                        {#each ingredients as ingredient}
                            <div
                                class="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded-lg"
                            >
                                <span class="text-sm font-medium text-gray-800">
                                    {ingredient.Ingredient.IngredientName}
                                </span>
                                <span class="text-xs text-gray-600 font-medium">
                                    {(
                                        ingredient.Quantity * scalingFactor
                                    ).toFixed(
                                        (ingredient.Quantity * scalingFactor) %
                                            1 ===
                                            0
                                            ? 0
                                            : 1,
                                    )}
                                    {ingredient.Measurement || ""}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Items -->
                {#if items.length > 0}
                    <div>
                        <h2
                            class="text-lg font-bold text-gray-800 tracking-tight mb-3"
                        >
                            equipment
                        </h2>
                        <div class="space-y-1.5">
                            {#each items as item}
                                <div
                                    class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                                >
                                    <span
                                        class="text-sm font-medium text-gray-800"
                                    >
                                        {item.Item.ItemName}
                                    </span>
                                    <span class="text-xs text-gray-600">
                                        {item.Quantity}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Notes -->
                {#if note && note.trim() !== ""}
                    <div>
                        <h2
                            class="text-lg font-bold text-gray-800 tracking-tight mb-3"
                        >
                            notes
                        </h2>
                        <div
                            class="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <p class="text-gray-700 text-sm leading-relaxed">
                                {note}
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
