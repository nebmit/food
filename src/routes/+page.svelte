<script lang="ts">
    import { goto } from "$app/navigation";
    import Navbar from "$lib/fragments/navbar.svelte";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import type { Recipe } from "$lib/types";

    export let data: { randomRecipes: Recipe[] };

    let searchQuery = "";

    function gotoExplore() {
        goto("/explore" + (searchQuery ? "?q=" + searchQuery : ""));
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            gotoExplore();
        }
    }
</script>

<Navbar />

<div class="container mx-auto">
    <div class="flex flex-col h-[calc(100dvh)] justify-center">
        <div class="flex flex-col space-y-4 w-full mt-36 mb-96">
            <h1 id="title" class="flex flex-row justify-center select-none">
                food
            </h1>
            <div class="flex flex-row justify-center w-full space-x-4">
                <input
                    type="text"
                    class="w-1/3 border-2 border-slate-300 bg-white h-10 px-5 pr-16 rounded-lg text-lg focus:outline-none hover:shadow-md focus:shadow-md transition ease-in-out duration-200 transform"
                    placeholder="Search"
                    on:keydown={handleKeydown}
                    bind:value={searchQuery}
                />
                <button
                    class="hover:bg-slate-500 hover:text-white bg-slate-100 text-slate-900 px-4 py-2 rounded transition ease-in-out duration-200 transform"
                    on:click={gotoExplore}
                >
                    explore
                </button>
            </div>
            <div class="hidden sm:flex flex-row justify-center space-x-8 pt-12">
                {#each data.randomRecipes as recipe}
                    <RecipeCard {recipe} />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    #title {
        font-family: "Montserrat", monospace;
        font-size: 4rem;
        font-weight: 500;
        letter-spacing: 0.2rem;
    }
</style>
