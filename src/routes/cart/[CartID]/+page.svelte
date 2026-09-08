<script lang="ts">
    import { formatMeasure } from "$lib/format";
    import type { CartIngredient } from "$lib/types";

    export let data: { cart: CartIngredient[] };
    let cart = data.cart;

    let checkedItems: Record<string, boolean> = {};

    function key(ingredient: CartIngredient): string {
        return `${ingredient.ingredient.IngredientName}-${ingredient.measurement}`;
    }

    function toggleChecked(ingredient: CartIngredient) {
        checkedItems[key(ingredient)] = !checkedItems[key(ingredient)];
    }

    function amount(ingredient: CartIngredient): string {
        if (ingredient.quantity > 0 && ingredient.measurement) {
            return formatMeasure(ingredient.quantity, ingredient.measurement);
        }
        return "";
    }

    $: checkedCount = Object.values(checkedItems).filter(Boolean).length;
</script>

<div class="flex-1 px-5 md:px-10 pb-24">
    <div class="sticky top-0 bg-white border-b border-ink py-3.5 flex items-baseline justify-between z-10">
        <h1 class="text-[22px] leading-none tracking-[-.02em] font-bold">Shopping list</h1>
        <span class="font-mono text-[11px] leading-none tracking-[.1em] text-muted"
            >{checkedCount} / {cart.length}</span
        >
    </div>

    <div class="flex flex-col">
        {#each cart as ingredient (key(ingredient))}
            {@const checked = !!checkedItems[key(ingredient)]}
            <button
                class="w-full text-left grid grid-cols-[26px_1fr_auto] gap-3 items-center min-h-12 border-b border-rule touch-manipulation {checked
                    ? 'text-muted-3'
                    : 'text-ink'}"
                on:click={() => toggleChecked(ingredient)}
                aria-pressed={checked}
            >
                <span
                    class="w-5 h-5 border border-ink flex items-center justify-center text-xs {checked
                        ? 'bg-ink text-white'
                        : 'bg-white'}"
                >
                    {checked ? "✓" : ""}
                </span>
                <span class="text-[15px] leading-[1.2] {checked ? 'line-through' : ''}">
                    {ingredient.ingredient.IngredientName}
                </span>
                <span class="text-sm text-muted tabular-nums whitespace-nowrap">
                    {amount(ingredient)}
                </span>
            </button>
        {/each}
    </div>
</div>

{#if checkedCount > 0}
    <div
        class="fixed inset-x-0 bottom-0 bg-white border-t border-ink px-5 py-4 flex items-center justify-between font-mono text-[11px] leading-none tracking-[.1em] uppercase"
    >
        <span class="text-muted">{checkedCount} of {cart.length} collected</span>
        {#if checkedCount === cart.length}
            <span class="text-accent">All done</span>
        {/if}
    </div>
{/if}
