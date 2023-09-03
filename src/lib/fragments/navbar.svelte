<script lang="ts">
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
            name: "About",
            link: "/about",
        },
    ];
</script>

<div style="background-color: var(--bg-color); z-index: 1;">
    <!-- Desktop Navbar -->
    <div class="hidden sm:flex justify-center items-center h-16 text-black">
        {#each buttons as button}
            <a
                href={button.link}
                class="mx-4 text-lg transition-all duration-300 ease-in-out hover:text-gray-700 custom-underline"
            >
                {button.name}
            </a>
        {/each}
    </div>

    <!-- Mobile Navbar -->
    <div class="sm:hidden flex justify-end items-center h-16 text-black">
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
        class="sm:hidden flex flex-col items-center text-black {show
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
        transition: max-height 0.5s ease-in-out, opacity 0.5s ease-in-out;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
    }
    .expand-transition {
        transition: max-height 0.5s ease-in-out, opacity 0.5s ease-in-out;
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
