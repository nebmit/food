<script lang="ts">
    import Logo from "$lib/components/logo.svelte";
    import Navbar from "$lib/fragments/navbar.svelte";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import Searchbar from "$lib/fragments/searchbar.svelte";
    import type { Recipe } from "$lib/types";
    import { onMount } from "svelte";

    export let data: { allRecipes: Recipe[] };

    let recipes = data.allRecipes;
    let searchQuery: string;

    function searchRecipes() {
        console.log("Searching for:", searchQuery);
        recipes = data.allRecipes.filter((recipe) =>
            recipe.RecipeName.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        const url = new URL(window.location.href);
        if (searchQuery === "") url.searchParams.delete("q");
        else url.searchParams.set("q", searchQuery);
        window.history.replaceState({}, "", url);
    }

    $: if (searchQuery !== undefined) {
        searchRecipes();
    }

    onMount(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has("q")) {
            searchQuery = url.searchParams.get("q") || "";
            searchRecipes();
        }
    });
</script>

<div class="container mx-auto flex-1">
    <div class="flex flex-col">
        <div class="flex flex-col space-y-4">
            <!-- Search Bar -->
            <div class="w-full max-w-2xl mx-auto mt-20">
                <Searchbar bind:searchQuery onSubmit={searchRecipes} />
            </div>

            <!-- Recipe Cards -->
            <div class="flex flex-row justify-center sm:pt-12">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8"
                >
                    {#if recipes.length === 0}
                        <div
                            class="col-span-full flex flex-col items-center justify-center pt-16"
                        >
                            <span
                                class="text-2xl font-semibold text-gray-500 mb-2"
                            >
                                No recipes found
                            </span>
                            <span class="text-base text-gray-400">
                                Try a different search term.
                            </span>
                        </div>
                    {:else}
                        {#each recipes as recipe}
                            <div class="mx-4 my-3">
                                <RecipeCard {recipe} />
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
