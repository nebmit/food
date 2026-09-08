<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="flex-1 px-5 md:px-10 py-16 flex flex-col items-start gap-4">
    <span class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3">
        Error {$page.status}
    </span>
    <h1 class="text-[34px] leading-none tracking-[-.03em] font-bold">
        {#if $page.error && $page.error.message}
            {$page.error.message}
        {:else if $page.status === 404}
            Page not found
        {:else if $page.status === 500}
            Something went wrong
        {:else}
            An error occurred
        {/if}
    </h1>
    <div class="flex gap-2.5 pt-2">
        {#if $page.status === 401}
            <a
                href="/login"
                class="border border-ink bg-ink text-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent"
            >
                Login
            </a>
        {/if}
        <a
            href="/"
            class="border border-ink bg-white font-mono text-[10px] leading-none tracking-[.14em] uppercase px-3.5 py-[11px] hover:bg-accent hover:border-accent hover:text-white"
        >
            Back to the index
        </a>
    </div>
</div>
