<script lang="ts">
    import type { Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { circIn, circOut } from "svelte/easing";
    import Logo from "../fragments/logo.svelte";
    import RecipeCard from "../fragments/recipeCard.svelte";
    import { glitch } from "../transitions";

    export let data: { randomRecipes: Recipe[] };

    let logo = false;
    let content = false;

    onMount(() => {
        logo = true;
        setTimeout(() => {
            logo = false;
            setTimeout(() => {
                document.body.style.backgroundColor = "var(--text-color)";
                document.body.style.color = "var(--bg-color)";
            }, 300);
            setTimeout(() => {
                content = true;
            }, 600);
        }, 1250);
    });
</script>

<div class="container mx-auto">
    <div class="flex flex-col h-screen justify-center">
        {#if logo}
            <div class="hidden lg:flex justify-center">
                <Logo
                    width="30%"
                    stroke="#8C8C8D"
                    inDuration={1250}
                    outTransition={{
                        fn: glitch,
                        displacement: 75,
                        duration: 600,
                        easing: circOut,
                    }}
                />
            </div>
        {:else if content}
            <div
                class="flex flex-col space-y-4 w-full mb-60"
                in:glitch={{
                    displacement: 75,
                    duration: 300,
                    easing: circIn,
                }}
            >
                <h1 id="title" class="flex flex-row justify-center">food</h1>
                <div class="flex flex-row justify-center w-full">
                    <input
                        type="text"
                        class="w-1/3 border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-lg focus:outline-none"
                        placeholder="Search"
                    />
                </div>
                <div class="flex flex-row justify-center space-x-8 pt-12">
                    {#each data.randomRecipes as recipe}
                        <RecipeCard {recipe} />
                    {/each}
                </div>
            </div>
        {/if}
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
