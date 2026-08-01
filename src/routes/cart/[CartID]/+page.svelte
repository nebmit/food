<script lang="ts">
    import type { CartIngredient } from "$lib/types";

    export let data: { cart: CartIngredient[] };
    let cart = data.cart;

    let checkedItems: Record<string, boolean> = {};

    function toggleChecked(ingredientName: string) {
        checkedItems[ingredientName] = !checkedItems[ingredientName];
    }
</script>

<div class="bg-gray-50 pb-safe flex-1">
    <!-- Header -->
    <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-gray-800">shopping list</h1>
            <div class="text-sm text-gray-600">
                {Object.values(checkedItems).filter(Boolean).length} / {cart.length}
            </div>
        </div>
    </div>

    <!-- Shopping List -->
    <div class="px-4 py-4 space-y-2 mb-8">
        {#each cart as ingredient (ingredient.ingredient.IngredientID)}
            <button
                class={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 touch-manipulation ${
                    checkedItems[ingredient.ingredient.IngredientName]
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-white border-2 border-gray-100 active:bg-gray-50"
                }`}
                on:click={() =>
                    toggleChecked(ingredient.ingredient.IngredientName)}
            >
                <!-- Checkbox -->
                <div
                    class={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        checkedItems[ingredient.ingredient.IngredientName]
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300"
                    }`}
                >
                    {#if checkedItems[ingredient.ingredient.IngredientName]}
                        <svg
                            class="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="3"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    {/if}
                </div>

                <!-- Item Details -->
                <div class="flex-1 text-left">
                    <div
                        class={`text-base font-medium transition-all duration-200 ${
                            checkedItems[ingredient.ingredient.IngredientName]
                                ? "text-green-700 line-through"
                                : "text-gray-800"
                        }`}
                    >
                        {ingredient.ingredient.IngredientName}
                    </div>
                    <div
                        class={`text-xs transition-all duration-200 ${
                            checkedItems[ingredient.ingredient.IngredientName]
                                ? "text-green-600"
                                : "text-gray-600"
                        }`}
                    >
                        {ingredient.quantity}
                        {ingredient.measurement}
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <!-- Progress Footer (only show when items are checked) -->
    {#if Object.values(checkedItems).some(Boolean)}
        <div
            class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 safe-area-inset-bottom"
        >
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">
                    {Object.values(checkedItems).filter(Boolean).length} of {cart.length}
                    items collected
                </span>
                {#if Object.values(checkedItems).filter(Boolean).length === cart.length}
                    <span class="text-sm font-medium text-green-600"
                        >✓ All done!</span
                    >
                {/if}
            </div>
        </div>
    {/if}
</div>
