<script lang="ts">
    import { stars } from "$lib/actions";
    import { setToCart } from "$lib/cart";
    import Navbar from "$lib/fragments/navbar.svelte";
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
    $: scalingFactor = selectedPortion / recipeVersion.PortionQuantity;
</script>

<div class="hidden sm:inline">
    <Navbar />
</div>

<div class="max-w-screen-lg mx-auto p-4 lg:mt-10">
    <div class="relative h-40 mb-6">
        <img
            class="absolute top-0 left-0 w-full h-full rounded-t-lg object-cover object-center blur-sm"
            src={imageUrl}
            alt={recipe.RecipeName}
        />

        {#if user.isAuthenticated}
            <button
                class="absolute top-2 right-2 bg-slate-400 bg-opacity-40 hover:bg-opacity-60 text-white font-bold py-2 px-4 rounded"
                on:click={() => {
                    setToCart(recipe, selectedPortion);
                }}
            >
                Add to Shopping List
            </button>
        {/if}

        <div
            class="relative text-center top-1/3 p-2 px-4 text-white text-3xl font-bold text-shadow"
        >
            {recipe.RecipeName}
        </div>
    </div>

    <!-- Additional Information -->
    <div class="hidden md:inline">
        <hr />
        <div
            class="my-4 px-4 text-lg flex flex-wrap justify-between items-center"
        >
            <div class="flex flex-wrap items-center space-x-2">
                <div class="flex items-center">
                    <input
                        bind:value={selectedPortion}
                        type="number"
                        class="w-16 text-center border border-gray-300 rounded px-2 py-1 mr-2"
                        min="1"
                    />
                    {recipeVersion.PortionDescriptor}
                </div>
                <span>|</span>
                <div class="flex items-center">
                    ~ {recipeVersion.ActiveTimeMinutes +
                        recipeVersion.PassiveTimeMinutes} Minutes
                </div>
                <span>|</span>
                {#if recipeVersion.ComplexityRating}
                    <div class="text-cyan-500">
                        Complexity
                        <span
                            use:stars={{
                                total: 5,
                                filled: recipeVersion.ComplexityRating,
                            }}
                        />
                    </div>
                    <span>|</span>
                {/if}
                {#if recipeVersion.MayhemRating}
                    <div class="text-purple-500">
                        Mayhem
                        <span
                            use:stars={{
                                total: 5,
                                filled: recipeVersion.MayhemRating,
                            }}
                        />
                    </div>
                {/if}
            </div>

            <!-- Recipe Version -->
            <div class="hidden lg:flex items-center">
                <span class="text-blue-400 mr-4">
                    #{recipeVersion.RecipeVersionID}
                </span>
            </div>
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 col-span-1">
            <div class="md:hidden mb-4">
                <input
                    bind:value={selectedPortion}
                    type="number"
                    class="w-16 text-center border border-gray-300 rounded px-2 py-1 mr-2"
                    min="1"
                />
                {recipeVersion.PortionDescriptor}
            </div>

            <!-- Ingredients List -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each ingredients as ingredient}
                    <div class="col-span-1">
                        {ingredient.Ingredient.IngredientName}
                    </div>
                    <div class="col-span-1">
                        {ingredient.Quantity * scalingFactor}
                        {ingredient.Measurement ? ingredient.Measurement : ""}
                    </div>
                {/each}
            </div>

            <!-- Items List -->
            <h2 class="text-xl font-semibold mb-2 mt-8">Items</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each items as item}
                    <div class="col-span-1">
                        {item.Item.ItemName}
                    </div>
                    <div class="col-span-1">
                        {item.Quantity}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Instructions -->
        <div class="p-4 col-span-2">
            <h2 class="text-xl font-semibold mb-2">Method</h2>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
                {#each instructions as instruction}
                    <div class="col-span-2">
                        <span class="text-sm">Step</span>
                        <span class="font-semibold"
                            >{instruction.StepNumber}</span
                        >
                    </div>
                    <div class="col-span-10">
                        {parseInstructionScaled(
                            instruction.StepDetail,
                            ingredients,
                            scalingFactor,
                        )}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .text-shadow {
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.75);
    }

    h2 {
        font-family: "Montserrat";
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 600;
        letter-spacing: 0.1rem;
    }

    hr {
        border: 1px solid #ccc;
    }
</style>
