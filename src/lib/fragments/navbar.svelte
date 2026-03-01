<script lang="ts">
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import type { User } from "../../app";
    import Logo from "$lib/components/logo.svelte";

    let show = false;
    function toggleMenu() {
        show = !show;
    }

    const buttons = [
        {
            name: "Random",
            link: "/",
        },
        {
            name: "Search",
            link: "/search",
        },
        {
            name: "Groceries",
            link: "/cart",
        },
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
</script>

<!-- Modern Minimalistic Navbar -->
<nav
    class="bg-white border-b border-black/5 fixed top-0 left-0 right-0 z-50 transition-all duration-300"
>
    <!-- Desktop Navbar -->
    <div
        class="hidden md:flex items-center justify-between h-16 px-8 max-w-6xl mx-auto"
    >
        <!-- Logo/Brand Area -->
        <div class="flex-1">
            <a href="/" class="inline-flex items-center">
                <Logo />
            </a>
        </div>

        <!-- Navigation Links -->
        <div class="flex flex-1 justify-center items-center max-w-96 mx-auto">
            {#each buttons as button}
                <a
                    href={button.link}
                    class="flex-1 text-center text-gray-600 hover:text-gray-800 text-sm font-medium tracking-wide uppercase py-2 relative transition-all duration-300 group"
                >
                    {button.name}
                    <span
                        class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gray-800 transition-all duration-300 -translate-x-1/2 group-hover:w-[calc(100%-1rem)]"
                    ></span>
                </a>
            {/each}
        </div>

        <!-- User Actions -->
        <div class="flex-1 flex justify-end">
            {#if user.isAuthenticated}
                <a
                    href={logoutURL}
                    class="flex items-center gap-2 px-6 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:bg-gray-50/80 rounded-md"
                    aria-label="Logout"
                >
                    <svg
                        class="w-4 h-4 stroke-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    <span class="hidden lg:inline">Logout</span>
                </a>
            {:else}
                <a
                    href={loginURL}
                    class="flex items-center gap-2 px-6 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:bg-gray-50/80 rounded-md"
                    aria-label="Login"
                >
                    <svg
                        class="w-4 h-4 stroke-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 713 3v1"
                        />
                    </svg>
                    <span class="hidden lg:inline">Login</span>
                </a>
            {/if}
        </div>
    </div>

    <!-- Mobile Navbar -->
    <div class="md:hidden flex items-center justify-between h-16 px-4">
        <!-- Logo/Brand -->
        <div class="flex-1">
            <a href="/" class="inline-flex items-center">
                <Logo />
            </a>
        </div>

        <!-- Mobile Actions -->
        <div class="flex items-center gap-4">
            <button
                class="p-2 hover:bg-gray-100/50 rounded-md transition-all duration-300"
                on:click={toggleMenu}
                aria-label="Toggle menu"
            >
                <div class="w-6 h-5 relative">
                    <span
                        class="absolute h-0.5 w-full bg-gray-600 rounded-full transform transition-all duration-300 {show
                            ? 'top-2 rotate-45'
                            : 'top-0'}"
                    ></span>
                    <span
                        class="absolute top-2 h-0.5 w-full bg-gray-600 rounded-full transition-all duration-300 {show
                            ? 'opacity-0'
                            : 'opacity-100'}"
                    ></span>
                    <span
                        class="absolute h-0.5 w-full bg-gray-600 rounded-full transform transition-all duration-300 {show
                            ? 'top-2 -rotate-45'
                            : 'top-4'}"
                    ></span>
                </div>
            </button>
        </div>
    </div>

    <!-- Simple Mobile Menu -->
    {#if show}
        <div
            class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-black/5 shadow-lg z-40"
        >
            <div class="p-4 space-y-2">
                {#each buttons as button}
                    <a
                        href={button.link}
                        class="block text-gray-600 hover:text-gray-900 font-medium text-base py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-50/80 text-center"
                        on:click={toggleMenu}
                    >
                        {button.name}
                    </a>
                {/each}
                <div class="h-px bg-black/5 my-3"></div>
                {#if user.isAuthenticated}
                    <a
                        href={logoutURL}
                        class="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-base py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-50/80"
                        on:click={toggleMenu}
                    >
                        <svg
                            class="w-4 h-4 stroke-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1"
                            />
                        </svg>
                        <span>Logout</span>
                    </a>
                {:else}
                    <a
                        href={loginURL}
                        class="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-base py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-50/80"
                        on:click={toggleMenu}
                    >
                        <svg
                            class="w-4 h-4 stroke-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713 3v1"
                            />
                        </svg>
                        <span>Login</span>
                    </a>
                {/if}
            </div>
        </div>
    {/if}
</nav>
