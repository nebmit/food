<script lang="ts">
    import { pageTitle } from "$lib/stores";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";
    import "../app.css";
    import type { LayoutData } from "./$types";
    import Navbar from "$lib/fragments/navbar.svelte";
    import Footer from "$lib/fragments/footer.svelte";

    export let data: LayoutData;

    const user = writable({});
    $: user.set(data.user || { isAuthenticated: false });

    setContext("user", user);
</script>

<svelte:head>
    <title>{$pageTitle || "Food | TBW"}</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-white text-ink font-sans">
    <Navbar dataInfo={data.dataInfo} />
    <main class="flex-1 flex flex-col w-full max-w-[1280px] mx-auto">
        <slot />
    </main>
    <Footer dataInfo={data.dataInfo} recipeCount={data.recipeCount} />
</div>
