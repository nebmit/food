<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import type { Recipe } from "$lib/types";

    export let data: { allRecipes: Recipe[] };

    let recipes = data.allRecipes;
</script>

<div class="hidden sm:inline">
    <Navbar />
</div>

<div class="container mx-auto">
    <div class="flex flex-col h-screen">
        <div class="flex flex-col space-y-4">
            <h1
                id="title"
                class="hidden sm:flex flex-row justify-center select-none"
            >
                food
            </h1>
            <div class="flex flex-row justify-center w-full space-x-4">
                <input
                    type="text"
                    class="w-1/2 sm:w-1/3 border-2 border-slate-300 bg-white h-10 px-5 pr-16 rounded-lg text-lg focus:outline-none hover:shadow-md focus:shadow-md transition ease-in-out duration-200 transform"
                    placeholder="Search"
                />
                <button
                    class="hidden sm:inline hover:bg-slate-500 hover:text-white bg-slate-100 text-slate-900 px-4 py-2 rounded transition ease-in-out duration-200 transform"
                >
                    explore
                </button>
                <div class="inline sm:hidden -mt-3">
                    <Navbar />
                </div>
            </div>
            <div class="flex flex-row justify-center sm:pt-12">
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {#each recipes as recipe}
                        <div class="mx-4 my-3">
                            <RecipeCard {recipe} />
                        </div>
                    {/each}
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
