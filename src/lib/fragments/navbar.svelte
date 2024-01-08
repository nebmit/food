<script lang="ts">
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import type { User } from "../../app";

    let show = false;
    function toggleMenu() {
        show = !show;
    }

    const buttons = [
        {
            name: "Home",
            link: "/",
        },
        {
            name: "Explore",
            link: "/explore",
        },
        {
            name: "List",
            link: "/cart",
        },
    ];

    const userStore = getContext<Writable<User>>("user");

    let user: User;
    userStore.subscribe((value: User) => {
        user = value;
    });

    let ssoURL = import.meta.env.VITE_SSO_URL;

    let loginURL = `${ssoURL}/login`;
    let logoutURL = `${ssoURL}/logout`;
    onMount(() => {
        loginURL = `${ssoURL}/login?redirect_uri=${window.location}`;
        logoutURL = `${ssoURL}/logout?redirect_uri=${window.origin}`;
    });
</script>

<div style="z-index: 1;">
    <!-- Desktop Navbar -->
    <div class="hidden sm:flex items-center h-16">
        <!-- Left Element -->
        <div class="flex-shrink-0 w-1/4 pl-4"></div>

        <!-- Centered Elements -->
        <div class="flex-grow flex justify-center">
            {#each buttons as button}
                <a
                    href={button.link}
                    class="mx-4 text-lg transition-all duration-300 ease-in-out hover:text-gray-700 custom-underline"
                >
                    {button.name}
                </a>
            {/each}
        </div>

        <!-- Right Element -->
        <div class="flex-shrink-0 w-1/4 pr-4 text-right">
            {#if user.isAuthenticated}
                <a
                    href={logoutURL}
                    class="hover:text-gray-700"
                    aria-label="Logout"
                >
                    Logout
                </a>
            {:else}
                <a
                    href={loginURL}
                    class="hover:text-gray-700"
                    aria-label="Login"
                >
                    Login
                </a>
            {/if}
        </div>
    </div>

    <!-- Mobile Navbar -->
    <div class="sm:hidden flex justify-end items-center h-16">
        {#if user.isAuthenticated}
            <a href={logoutURL} class="hover:text-gray-700" aria-label="Logout">
                Logout
            </a>
        {:else}
            <a href={loginURL} class="hover:text-gray-700" aria-label="Login">
                Login
            </a>
        {/if}
        <button class="mx-2" on:click={toggleMenu}>
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                />
            </svg>
        </button>
    </div>
    <div
        class="sm:hidden flex flex-col items-center {show
            ? 'expand-transition'
            : 'collapse-transition'}"
    >
        {#each buttons as button}
            <a
                href={button.link}
                class="mx-4 transition-all duration-300 my-2 ease-in-out hover:text-gray-700 custom-underline"
            >
                {button.name}
            </a>
        {/each}
    </div>
</div>

<style>
    /* Custom CSS for smooth expand/collapse */
    .collapse-transition {
        transition:
            max-height 0.5s ease-in-out,
            opacity 0.5s ease-in-out;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
    }
    .expand-transition {
        transition:
            max-height 0.5s ease-in-out,
            opacity 0.5s ease-in-out;
        max-height: 12rem; /* approx size of three buttons */
        opacity: 1;
    }

    .custom-underline {
        position: relative;
        overflow: hidden;
    }
    .custom-underline:after {
        content: "";
        position: absolute;
        width: 0%;
        height: 1px;
        background: currentColor;
        bottom: 0;
        left: 50%;
        transition: all 0.5s ease-in-out;
    }
    .custom-underline:hover:after {
        width: 100%;
        left: 0;
    }
</style>
