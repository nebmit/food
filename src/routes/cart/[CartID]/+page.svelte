<script lang="ts">
    import type { CartIngredient } from "$lib/types";

    export let data: { cart: CartIngredient[] };
    let cart = data.cart;

    let checkedItems: Record<string, boolean> = {};

    function toggleChecked(ingredientName: string) {
        checkedItems[ingredientName] = !checkedItems[ingredientName];
    }
</script>

<div class="p-4 min-h-screen">
    <h1 class="text-2xl font-bold text-center mb-6">Shopping List</h1>
    <div class="flex flex-col space-y-3 md:w-1/2 mx-auto">
        {#each cart as ingredient}
            <button
                class={`flex items-center w-full justify-between p-3 rounded-lg shadow-md cursor-pointer ${
                    checkedItems[ingredient.ingredient.IngredientName]
                        ? "checked-item"
                        : "bg-white"
                }`}
                on:click={() =>
                    toggleChecked(ingredient.ingredient.IngredientName)}
                on:keydown={() =>
                    toggleChecked(ingredient.ingredient.IngredientName)}
            >
                <span
                    class={`text-lg ${
                        checkedItems[ingredient.ingredient.IngredientName]
                            ? "line-through text-gray-500"
                            : "text-gray-800"
                    }`}
                >
                    {ingredient.ingredient.IngredientName} - {ingredient.quantity}
                    {ingredient.measurement}
                </span>
                <input
                    type="checkbox"
                    class="h-5 w-5"
                    checked={checkedItems[ingredient.ingredient.IngredientName]}
                />
            </button>
        {/each}
    </div>
</div>

<style>
    .checked-item {
        background-color: #d1d5db;
    }
</style>
