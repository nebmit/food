<script lang="ts">
    export let searchQuery: string;
    export let onSubmit = () => {};

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            onSubmit();
        }
    }

    function clearQuery() {
        searchQuery = "";
    }
</script>

<div class="flex flex-col sm:flex-row gap-3 items-center">
    <div class="relative flex-1 w-full">
        <input
            type="text"
            class="w-full h-12 px-6 text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 transition-colors duration-200 placeholder-gray-400"
            placeholder="search recipes..."
            on:keydown={handleKeydown}
            bind:value={searchQuery}
        />
        {#if searchQuery}
            <button
                class="absolute top-1/2 -translate-y-1/2 right-3 text-slate-600 hover:text-slate-800 transition ease-in-out duration-200 transform"
                on:click={clearQuery}
                aria-label="Clear search query"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class="h-6 w-6"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        {:else}
            <svg
                class="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        {/if}
    </div>
    <button
        class="h-12 px-8 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200 whitespace-nowrap"
        on:click={onSubmit}
    >
        search
    </button>
</div>
