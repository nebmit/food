<script lang="ts">
    export let searchQuery = "";
    export let placeholder = "Search recipes";
    export let onSubmit: () => void = () => {};

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            onSubmit();
        }
    }
</script>

<div class="flex items-center gap-2.5 border-b border-ink pb-2">
    <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        class="text-muted shrink-0"
        aria-hidden="true"
    >
        <circle cx="7" cy="7" r="4.6"></circle>
        <path d="M10.4 10.4 L14 14"></path>
    </svg>
    <input
        type="text"
        class="flex-1 min-w-0 border-0 outline-none bg-transparent text-base text-ink p-0"
        {placeholder}
        aria-label={placeholder}
        on:keydown={handleKeydown}
        bind:value={searchQuery}
    />
</div>
