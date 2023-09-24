<script lang="ts">
    import { goto } from "$app/navigation";
    import Logo from "$lib/fragments/logo.svelte";
    import Navbar from "$lib/fragments/navbar.svelte";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import { glitch } from "$lib/transitions";
    import type { Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { circIn, circOut } from "svelte/easing";

    export let data: { randomRecipes: Recipe[] };

    let logo = false;
    let content = false;
    let contentInDuration = 300;

    onMount(() => {
        sessionStorage.getItem("alreadyPlayedLogo") === "true"
            ? (() => {
                  contentInDuration = 0;
                  document.body.style.backgroundColor = "var(--bg-color)";
                  document.body.style.color = "var(--text-color)";
                  logo = false;
                  content = true;
              })()
            : (() => {
                  sessionStorage.setItem("alreadyPlayedLogo", "true");
                  content = false;
                  logo = true;
                  setTimeout(() => {
                      logo = false;
                      setTimeout(() => {
                          document.body.style.backgroundColor =
                              "var(--bg-color)";
                          document.body.style.color = "var(--text-color)";
                      }, 300);
                      setTimeout(() => {
                          content = true;
                      }, 600);
                  }, 1250);
              })();
    });

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

{#if content}
    <Navbar />
{/if}

<div class="container mx-auto">
    <div class="flex flex-col h-full justify-center">
        {#if logo}
            <div class="flex h-screen justify-center">
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
                class="flex flex-col space-y-4 w-full mt-36 mb-96"
                in:glitch={{
                    displacement: 75,
                    duration: contentInDuration,
                    easing: circIn,
                }}
            >
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
                <div
                    class="hidden sm:flex flex-row justify-center space-x-8 pt-12"
                >
                    {#each data.randomRecipes as recipe}
                        <RecipeCard {recipe} />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<svelte:head>
    <style>
        body {
            background-color: var(--text-color);
            color: var(--bg-color);
        }
    </style>
</svelte:head>

<style>
    #title {
        font-family: "Montserrat", monospace;
        font-size: 4rem;
        font-weight: 500;
        letter-spacing: 0.2rem;
    }
</style>
