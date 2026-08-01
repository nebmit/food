<script lang="ts">
    import { goto } from "$app/navigation";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import Searchbar from "$lib/fragments/searchbar.svelte";
    import type { Recipe } from "$lib/types";

    export let data: { randomRecipes: Recipe[] };

    let searchQuery = "";
    function goToSearch() {
        const url = "/search" + (searchQuery ? "?q=" + searchQuery : "");
        goto(url);
    }
</script>

<div class="bg-white flex-1">
    <!-- Hero Section -->
    <div class="max-w-6xl mx-auto px-8">
        <div class="flex flex-col items-center justify-center pt-24 pb-16">
            <!-- Search Section -->
            <div class="w-full max-w-2xl mx-auto mt-8 mb-16">
                <Searchbar bind:searchQuery onSubmit={goToSearch} />
            </div>

            <!-- Featured Recipes Section -->
            {#if data.randomRecipes && data.randomRecipes.length > 0}
                <div class="w-full">
                    <div class="text-center mb-8">
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight"
                        >
                            some random recipes
                        </h2>
                    </div>
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
                    >
                        {#each data.randomRecipes as recipe (recipe.RecipeID)}
                            <RecipeCard {recipe} />
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
