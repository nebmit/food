<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { applyPath, encodePath, groupBy, matchesQuery } from "$lib/facets";
    import { formatTime, rating } from "$lib/format";
    import ExampleGrid from "$lib/fragments/exampleGrid.svelte";
    import Searchbar from "$lib/fragments/searchbar.svelte";
    import type { RecipeSummary } from "$lib/types";

    export let data: { summaries: RecipeSummary[] };

    // Read once, identically on server and client, so a shared ?q= link survives hydration.
    let searchQuery = $page.url.searchParams.get("q") ?? "";

    $: summaries = data.summaries;
    $: filtered = summaries.filter((s) => matchesQuery(s, searchQuery));
    $: categories = groupBy(summaries, "tag").map(([label, count]) => ({
        label,
        count,
        sub: groupBy(applyPath(summaries, [label]), "cuisine")
            .slice(0, 3)
            .map(([cuisine]) => cuisine.toLowerCase())
            .join(" · "),
        href: `/search?f=${encodePath([label])}`,
    }));

    // Mirror the live filter in the URL so a search can be shared or reloaded.
    $: if (browser && searchQuery !== undefined) {
        const url = new URL(window.location.href);
        if (searchQuery) url.searchParams.set("q", searchQuery);
        else url.searchParams.delete("q");
        window.history.replaceState({}, "", url);
    }

    function totalTime(summary: RecipeSummary): string {
        return formatTime(summary.ActiveTimeMinutes + summary.PassiveTimeMinutes);
    }
</script>

<div class="flex-1">
    <!-- Hero: count, tagline, search · worked example -->
    <div class="grid md:grid-cols-[1fr_540px] items-stretch">
        <div
            class="px-5 md:px-10 pt-[34px] pb-[30px] flex flex-col justify-end gap-[18px]"
        >
            <div class="flex items-baseline flex-wrap gap-x-[14px] gap-y-1">
                <h1
                    class="text-[34px] leading-none tracking-[-.03em] font-bold whitespace-nowrap"
                >
                    {summaries.length}
                    {summaries.length === 1 ? "recipe" : "recipes"}
                </h1>
                <span class="text-sm text-muted">
                    Plain text in git, rendered as tables.
                </span>
            </div>
            <Searchbar bind:searchQuery />
        </div>
        <div
            class="hidden md:flex mt-[34px] mr-10 mb-[30px] flex-col gap-2.5"
        >
            <div class="flex items-baseline justify-between">
                <span
                    class="font-mono text-[10px] leading-none tracking-[.14em] uppercase text-muted-3"
                    >Example</span
                >
                <span
                    class="font-mono text-[10px] leading-none tracking-[.1em] text-muted-4"
                    >4 ingredients · 3 steps</span
                >
            </div>
            <ExampleGrid />
            <div
                class="flex gap-[18px] font-mono text-[10px] leading-none tracking-[.1em] uppercase text-muted-4"
            >
                <span>Rows = ingredients</span><span>Right = later</span><span
                    >Line = carried, untouched</span
                >
            </div>
        </div>
    </div>

    <!-- Categories -->
    {#if categories.length > 0}
        <div class="px-5 md:px-10 pt-1 pb-[26px]">
            <div
                class="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5"
            >
                {#each categories as category (category.label)}
                    <a
                        href={category.href}
                        class="group text-left bg-white border border-ink p-3.5 flex flex-col gap-[9px] min-h-[104px] hover:bg-accent hover:border-accent hover:text-white"
                    >
                        <span
                            class="flex items-baseline justify-between gap-2"
                        >
                            <span
                                class="text-[19px] font-bold tracking-[-.02em] leading-[1.1]"
                                >{category.label}</span
                            >
                            <span class="font-mono text-[11px] leading-none"
                                >{category.count}</span
                            >
                        </span>
                        <span
                            class="font-mono text-[10px] leading-[1.5] tracking-[.06em] opacity-[.62] mt-auto"
                            >{category.sub}</span
                        >
                    </a>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Index -->
    <div class="px-5 md:px-10 pb-10">
        <div
            class="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_84px_100px_84px_20px] font-mono text-[10px] leading-none tracking-[.12em] uppercase text-muted-3 pb-2.5 border-b border-ink"
        >
            <span>Recipe</span>
            <span class="hidden md:block">Cuisine</span>
            <span class="text-right">Time</span>
            <span class="hidden md:block text-right">Complexity</span>
            <span class="hidden md:block text-right">Mayhem</span>
            <span class="hidden md:block"></span>
        </div>
        {#each filtered as summary (summary.RecipeID)}
            <a
                href={"/recipe/" + encodeURIComponent(summary.RecipeName)}
                class="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_84px_100px_84px_20px] items-baseline px-2 py-2.5 -mx-2 text-[15px] hover:bg-row-hover hover:text-accent"
            >
                <span class="font-medium">{summary.RecipeName}</span>
                <span
                    class="hidden md:block font-mono text-xs leading-none text-muted"
                    >{summary.Cuisine}</span
                >
                <span
                    class="text-right font-mono text-xs leading-none text-muted"
                    >{totalTime(summary)}</span
                >
                <span
                    class="hidden md:block text-right text-xs text-muted tracking-[.14em]"
                    >{rating(summary.ComplexityRating)}</span
                >
                <span
                    class="hidden md:block text-right text-xs text-muted tracking-[.14em]"
                    >{rating(summary.MayhemRating)}</span
                >
                <span class="hidden md:block text-right text-accent">→</span>
            </a>
        {:else}
            <div class="py-7 text-[15px] text-muted-2">
                {#if summaries.length === 0}
                    No recipes yet.
                {:else}
                    Nothing matches “{searchQuery}”.
                {/if}
            </div>
        {/each}
    </div>
</div>
