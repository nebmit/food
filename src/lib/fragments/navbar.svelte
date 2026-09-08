<script lang="ts">
    import { page } from "$app/stores";
    import type { DataInfo } from "$lib/types";
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import type { User } from "../../app";

    export let dataInfo: DataInfo;

    let show = false;
    function toggleMenu() {
        show = !show;
    }

    const links = [
        { name: "Index", href: "/" },
        { name: "Random", href: "/random" },
        { name: "Groceries", href: "/cart" },
    ];

    const userStore = getContext<Writable<User>>("user");

    let user: User;
    userStore.subscribe((value: User) => {
        user = value;
    });

    let loginURL = import.meta.env.VITE_LOGIN_URL;
    let logoutURL = import.meta.env.VITE_LOGOUT_URL;
    onMount(() => {
        loginURL = `${loginURL}?redirect_uri=${window.location}`;
        logoutURL = `${logoutURL}?redirect_uri=${window.origin}`;
    });

    // Pages that want a specific crumb return `crumb` from their load function.
    $: crumbText =
        ($page.data.crumb as string | undefined) ??
        `${dataInfo.repoLabel} · ${dataInfo.branch ?? "main"}`;
</script>

<header class="border-b border-ink bg-white relative z-40">
    <div
        class="mx-auto w-full max-w-[1280px] flex items-center justify-between px-5 md:px-10 py-[14px]"
    >
        <div class="flex items-baseline gap-[14px] min-w-0">
            <a
                href="/"
                class="text-[17px] font-bold tracking-[-.02em] hover:text-accent"
            >
                food
            </a>
            <span
                class="font-mono text-[10px] leading-none tracking-[.1em] text-muted-3 truncate"
            >
                {crumbText}
            </span>
        </div>

        <!-- Desktop navigation -->
        <nav
            class="hidden md:flex gap-6 font-mono text-[11px] leading-none tracking-[.1em] uppercase"
        >
            {#each links as link (link.href)}
                <a href={link.href} class="hover:text-accent">{link.name}</a>
            {/each}
            {#if user.isAuthenticated}
                <a href={logoutURL} class="text-muted-3 hover:text-accent"
                    >Logout</a
                >
            {:else}
                <a href={loginURL} class="text-muted-3 hover:text-accent"
                    >Login</a
                >
            {/if}
        </nav>

        <!-- Mobile menu toggle -->
        <button
            class="md:hidden w-11 h-11 -mr-2.5 flex items-center justify-center"
            on:click={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={show}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                {#if show}
                    <path d="M4 4l12 12M16 4L4 16" />
                {:else}
                    <path d="M3 6h14M3 10h14M3 14h14" />
                {/if}
            </svg>
        </button>
    </div>

    {#if show}
        <nav
            class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-ink flex flex-col font-mono text-[11px] tracking-[.12em] uppercase"
        >
            {#each links as link (link.href)}
                <a
                    href={link.href}
                    class="px-5 py-4 border-b border-rule hover:bg-paper hover:text-accent"
                    on:click={toggleMenu}
                >
                    {link.name}
                </a>
            {/each}
            {#if user.isAuthenticated}
                <a
                    href={logoutURL}
                    class="px-5 py-4 text-muted-3 hover:bg-paper hover:text-accent"
                    on:click={toggleMenu}>Logout</a
                >
            {:else}
                <a
                    href={loginURL}
                    class="px-5 py-4 text-muted-3 hover:bg-paper hover:text-accent"
                    on:click={toggleMenu}>Login</a
                >
            {/if}
        </nav>
    {/if}
</header>
