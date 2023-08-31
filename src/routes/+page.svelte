<script lang="ts">
    import type { Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { circOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import Logo from "../fragments/logo.svelte";
    import { glitch } from "../transitions";

    export let data: { recipe: Recipe };

    let logo = false;
    let content = false;

    onMount(() => {
        logo = true;
        setTimeout(() => {
            logo = false;
            setTimeout(() => {
                content = true;
            }, 600);
        }, 1500);
    });
</script>

<div class="container mx-auto">
    <div class="flex flex-col h-screen justify-center">
        <div class="flex justify-center lg:hidden">
            <h1 class="text-2xl text-red-600" in:fly={{ delay: 500, y: -10 }}>
                Access denied
            </h1>
        </div>
        <div class="hidden lg:flex justify-center">
            {#if logo}
                <Logo
                    width="30%"
                    outTransition={{
                        fn: glitch,
                        displacement: 75,
                        duration: 600,
                        easing: circOut,
                    }}
                />
            {:else if content}
                <h1 class="text-2xl text-red-600" in:fly={{ y: -10 }}>
                    Access denied
                </h1>
            {/if}
        </div>
    </div>
</div>
