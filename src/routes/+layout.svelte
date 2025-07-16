<script lang="ts">
    import { pageTitle } from "$lib/stores";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";
    import "../app.css";
    import type { LayoutData } from "./$types";
    import Navbar from "$lib/fragments/navbar.svelte";

    export let data: LayoutData;

    const user = writable({});
    $: user.set(data.user || { isAuthenticated: false });

    setContext("user", user);
</script>

<svelte:head>
    <title>{$pageTitle || "Food | TBW"}</title>
</svelte:head>

<div class="layout-container">
    <Navbar />
    <main>
        <slot />
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .layout-container {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    main {
        padding-top: 4rem; /* 64px for navbar height */
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    :global(body > div) {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
</style>
