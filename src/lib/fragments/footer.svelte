<script lang="ts">
    import { page } from "$app/stores";
    import type { DataInfo } from "$lib/types";

    export let dataInfo: DataInfo;
    export let recipeCount: number;

    // Pages that want a specific note return `footerNote` from their load function.
    $: note =
        ($page.data.footerNote as string | undefined) ??
        `${recipeCount} ${recipeCount === 1 ? "recipe" : "recipes"} · last commit ${dataInfo.revision ?? "—"}`;
</script>

<footer class="border-t border-ink bg-white">
    <div
        class="mx-auto w-full max-w-[1280px] px-5 md:px-10 py-3 flex justify-between gap-4 font-mono text-[10px] leading-none tracking-[.08em] text-muted-3"
    >
        <span>food</span>
        <span class="truncate">{note}</span>
    </div>
</footer>
