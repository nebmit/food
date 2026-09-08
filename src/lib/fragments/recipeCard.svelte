<script lang="ts">
    import { formatTime, rating } from "$lib/format";
    import { imageFallback } from "$lib/imageFallback";
    import type { RecipeSummary } from "$lib/types";

    export let summary: RecipeSummary;
    /** Position in the full index, zero-padded ("07"). */
    export let no: string;

    $: encodedName = encodeURIComponent(summary.RecipeName);
    $: imageUrl = "/images/recipes/" + encodedName + ".webp";
    $: time = formatTime(summary.ActiveTimeMinutes + summary.PassiveTimeMinutes);
</script>

<a href={"/recipe/" + encodedName} class="bg-white flex flex-col hover:text-accent">
    <span class="relative block">
        <img
            src={imageUrl}
            alt=""
            class="w-full aspect-[4/3] object-cover block bg-canvas"
            loading="lazy"
            use:imageFallback
        />
        <span
            class="absolute top-0 left-0 bg-white px-1.5 py-[3px] font-mono text-[10px] leading-none text-muted"
            >{no}</span
        >
    </span>
    <span class="pt-[9px] flex flex-col gap-2 flex-1">
        <span class="text-[13px] font-medium leading-[1.25]">{summary.RecipeName}</span>
        <span
            class="mt-auto flex items-baseline justify-between gap-2 font-mono text-[10px] leading-none text-muted-2"
        >
            <span class="whitespace-nowrap">{time}</span>
            <span class="flex gap-[7px] tracking-[.1em] whitespace-nowrap">
                <span title="complexity">{rating(summary.ComplexityRating)}</span>
                <span title="mayhem" class="text-accent">{rating(summary.MayhemRating)}</span>
            </span>
        </span>
    </span>
</a>
