<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import type { Recipe } from "$lib/types";
    import { onMount } from "svelte";

    export let data: { allRecipes: Recipe[] };

    let recipes = data.allRecipes;
    let searchQuery = "";

    function searchRecipes() {
        recipes = data.allRecipes.filter((recipe) =>
            recipe.RecipeName.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        const url = new URL(window.location.href);
        if (searchQuery === "") url.searchParams.delete("query");
        else url.searchParams.set("query", searchQuery);
        window.history.replaceState({}, "", url);
    }

    function clearSearch() {
        searchQuery = "";
        searchRecipes();
    }

    onMount(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has("query")) {
            searchQuery = url.searchParams.get("query") || "";
            searchRecipes();
        }
    });
</script>

<div class="hidden sm:inline">
    <Navbar />
</div>

<div class="container mx-auto">
    <div class="flex flex-col h-[calc(100dvh)]">
        <div class="flex flex-col space-y-4">
            <!-- Title -->
            <h1
                id="title"
                class="hidden sm:flex flex-row justify-center select-none"
            >
                food
            </h1>

            <!-- Search Bar -->
            <div class="flex flex-row justify-center w-full space-x-4">
                <div class="relative w-1/2 sm:w-1/3">
                    <input
                        type="text"
                        class="w-full border-2 border-slate-300 bg-white h-10 px-5 pr-10 rounded-lg text-lg focus:outline-none hover:shadow-md focus:shadow-md transition ease-in-out duration-200 transform"
                        placeholder="Search"
                        bind:value={searchQuery}
                        on:input={searchRecipes}
                    />
                    {#if searchQuery}
                        <button
                            class="absolute top-1/2 -translate-y-1/2 right-3 text-slate-600 hover:text-slate-800 transition ease-in-out duration-200 transform"
                            on:click={clearSearch}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                class="h-6 w-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    {/if}
                </div>

                <button
                    class="hidden sm:inline hover:bg-slate-500 hover:text-white bg-slate-100 text-slate-900 px-4 py-2 rounded transition ease-in-out duration-200 transform"
                    on:click={searchRecipes}
                >
                    search
                </button>

                <div class="inline sm:hidden -mt-3">
                    <Navbar />
                </div>
            </div>

            <!-- Recipe Cards -->
            <div class="flex flex-row justify-center sm:pt-12">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {#if recipes.length === 0}
                        <div
                            class="col-span-full text-center py-10 text-lg text-gray-600"
                        >
                            No recipes found.
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

<style>
    #title {
        font-family: "Montserrat", monospace;
        font-size: 3rem;
        font-weight: 500;
        letter-spacing: 0.2rem;
    }
</style>
