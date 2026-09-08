<script lang="ts">
    import {
        applyPath,
        crumbs,
        encodePath,
        matchesQuery,
        options,
    } from "$lib/facets";
    import RecipeCard from "$lib/fragments/recipeCard.svelte";
    import type { RecipeSummary } from "$lib/types";

    export let data: { summaries: RecipeSummary[]; path: string[]; query: string };

    $: summaries = data.summaries;
    $: path = data.path;
    $: query = data.query;
    $: results = applyPath(summaries, path).filter((s) => matchesQuery(s, query));
    $: title = path.length ? path[path.length - 1] : "All recipes";
    $: countLabel =
        `${results.length} ${results.length === 1 ? "recipe" : "recipes"}` +
        (path.length || query ? "" : " — pick a category above to narrow");
    $: narrowing = options(summaries, path);
    $: showOptions = narrowing !== null && narrowing.opts.length > 1;
    $: numbers = new Map(summaries.map((s, index) => [s.RecipeID, index + 1]));

    function href(nextPath: string[]): string {
        const params: string[] = [];
        if (nextPath.length) params.push("f=" + encodePath(nextPath));
        if (query) params.push("q=" + encodeURIComponent(query));
        return "/search" + (params.length ? "?" + params.join("&") : "");
    }
</script>

<div class="flex-1">
    <!-- Crumbs -->
    <div
        class="px-5 md:px-10 pt-[22px] flex items-center flex-wrap gap-2 font-mono text-[11px] leading-none tracking-[.08em] text-muted-3"
    >
        {#each crumbs(path) as c, index (index)}
            <span class="flex items-center gap-2">
                {#if index > 0}<span>/</span>{/if}
                <a href={href(c.path)} class="hover:text-accent">{c.label}</a>
            </span>
        {/each}
    </div>

    <!-- Title -->
    <div
        class="px-5 md:px-10 pt-2.5 pb-4 flex items-baseline justify-between flex-wrap gap-x-10 gap-y-2"
    >
        <div class="flex items-baseline flex-wrap gap-x-[14px] gap-y-1">
            <h1
                class="text-[34px] leading-none tracking-[-.03em] font-bold whitespace-nowrap"
            >
                {title}
            </h1>
            <span class="text-sm text-muted">{countLabel}</span>
        </div>
        {#if path.length || query}
            <a
                href="/search"
                class="font-mono text-[10px] leading-none tracking-[.12em] uppercase text-accent hover:text-ink"
                >clear filters ×</a
            >
        {/if}
    </div>

    <!-- Narrowing options -->
    {#if narrowing && showOptions}
        <div class="px-5 md:px-10 pb-5 flex items-center gap-2.5 flex-wrap">
            <span
                class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3 mr-1"
                >{narrowing.label}</span
            >
            {#each narrowing.opts as [label, count] (label)}
                <a
                    href={href(path.concat([label]))}
                    class="text-[13px] leading-none text-ink bg-white border border-ink px-[11px] py-2 flex items-baseline gap-2 hover:bg-accent hover:border-accent hover:text-white"
                >
                    <span>{label}</span>
                    <span class="font-mono text-[10px] leading-none opacity-55"
                        >{count}</span
                    >
                </a>
            {/each}
        </div>
    {/if}

    <!-- Results -->
    <div class="px-5 md:px-10 pb-9">
        {#if results.length === 0}
            <div class="py-7 text-[15px] text-muted-2">
                {#if query}
                    Nothing matches “{query}”.
                {:else}
                    No recipes here.
                {/if}
            </div>
        {:else}
            <div
                class="grid grid-cols-2 md:grid-cols-5 gap-x-3.5 gap-y-[22px] items-stretch pt-0.5"
            >
                {#each results as summary (summary.RecipeID)}
                    <RecipeCard
                        {summary}
                        no={String(numbers.get(summary.RecipeID) ?? 0).padStart(2, "0")}
                    />
                {/each}
            </div>
        {/if}
        <div
            class="flex gap-[18px] pt-5 border-t border-rule mt-[22px] font-mono text-[10px] leading-none tracking-[.1em] uppercase text-muted-4"
        >
            <span>◼◻ complexity</span><span class="text-accent">◼◻ mayhem</span>
        </div>
    </div>
</div>
