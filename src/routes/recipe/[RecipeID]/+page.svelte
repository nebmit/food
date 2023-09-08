<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import type { Instruction, Recipe, RecipeIngredient } from "$lib/types";

    export let data: { recipe: Recipe };
    const recipe = data.recipe;
    const instructions: Instruction[] = recipe.MainVersion.Instructions;
    const ingredients: RecipeIngredient[] = recipe.MainVersion.Ingredients;

    const imageUrl = "/images/" + recipe.RecipeID + ".png";
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
        <div
            class="relative text-center top-1/3 p-2 px-4 text-white text-3xl font-bold text-shadow"
        >
            {recipe.RecipeName}
        </div>
    </div>

    <!-- Additional Information -->
    <div class="hidden sm:inline">
        <hr />
        <div
            class="my-4 px-4 text-lg flex flex-wrap justify-between items-center"
        >
            <div class="flex flex-wrap items-center space-x-2">
                <div class="flex items-center">
                    {recipe.PortionQuantity}
                    {recipe.PortionDescriptor}
                </div>
                <span>|</span>
                <div class="flex items-center">
                    ~ {recipe.EstimatedTime} Minutes
                </div>
                <span>|</span>
                {#if recipe.ComplexityRating}
                    <div class="text-cyan-500">
                        Complexity
                        {#each Array(5).fill(null) as _, i}
                            <span
                                >{i < recipe.ComplexityRating ? "★" : "☆"}</span
                            >
                        {/each}
                    </div>
                    <span>|</span>
                {/if}
                {#if recipe.MayhemRating}
                    <div class="text-purple-500">
                        Mayhem
                        {#each Array(5).fill(null) as _, i}
                            <span>{i < recipe.MayhemRating ? "★" : "☆"}</span>
                        {/each}
                    </div>
                {/if}
            </div>
            <!-- Your last element here -->
            <div class="hidden md:flex">
                <button
                    class="bg-blue-800 text-white hover:bg-blue-600 rounded px-4 py-1 font-semibold transition duration-200 ease-in-out"
                    >Edit</button
                >
            </div>
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Ingredients List -->
        <div class="p-4">
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each ingredients as ingredient}
                    <div class="col-span-1">
                        {ingredient.Ingredient.IngredientName}
                    </div>
                    <div class="col-span-1">
                        {ingredient.Quantity}
                        {ingredient.Measurement ? ingredient.Measurement : ""}
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
                        {instruction.StepDetail}
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
