<script lang="ts">
    import { getCart, getCartIngredients, setToCart } from "$lib/cart";
    import Navbar from "$lib/fragments/navbar.svelte";
    import type { Ingredient, Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { QRCodeImage } from "svelte-qrcode-image";

    let list_url: string | null = null;

    let cartItems: { recipe: Recipe; quantity: number }[] = [];
    let cartIngredients: {
        ingredient: Ingredient;
        quantity: number;
        measurement: string | undefined;
    }[] = [];

    onMount(async () => {
        loadCart();
    });

    function loadCart() {
        cartItems = getCart();
        cartIngredients = getCartIngredients();

        if (cartItems.length === 0) {
            list_url = null;
            return;
        }
    }

    function handleRemove(recipe: Recipe) {
        setToCart(recipe, -1);
        loadCart();
    }

    function updateRecipe(recipe: Recipe, quantity: number) {
        setToCart(recipe, quantity);
        loadCart();
    }
</script>

<Navbar />

<div class="container mx-auto p-6 mt-10 rounded-md max-w-4xl">
    <!-- QR Code and Cart Items -->
    <div class="flex flex-wrap -mx-2 mb-6">
        <!-- QR Code -->
        <div class="px-2 w-full md:w-64 md:mb-0 mb-6">
            {#if list_url}
                <QRCodeImage
                    bind:text={list_url}
                    errorCorrectionLevel="M"
                    displayType="canvas"
                    width={250}
                />
            {:else}
                <div class="w-60 h-60 p-5">
                    <img
                        src="/images/placeholder.png"
                        alt="Preparing QR code"
                    />
                </div>
            {/if}
        </div>

        <!-- Cart Items -->
        <div class="flex-1 px-2">
            <h1 class="text-2xl font-semibold mb-4">Your Cart</h1>
            <h2 class="text-xl font-medium mb-3">Recipes</h2>
            {#each cartItems as item}
                <div class="flex items-center justify-between p-2 mb-2">
                    <div class="flex items-center">
                        <input
                            type="number"
                            bind:value={item.quantity}
                            on:change={() =>
                                updateRecipe(item.recipe, item.quantity)}
                            class="input text-sm mr-2 w-16 border rounded-md p-1"
                        />
                        <span>{item.recipe.RecipeName}</span>
                    </div>
                    <button
                        on:click={() => handleRemove(item.recipe)}
                        class="text-white bg-red-500 px-3 py-1 rounded-md hover:bg-red-600 transition"
                        >Remove</button
                    >
                </div>
            {/each}
        </div>
    </div>

    <!-- Ingredients List -->
    <h2 class="text-xl font-medium mb-3">Ingredients</h2>
    <div class="grid grid-cols-2 gap-2">
        {#each cartIngredients as ingredient, index}
            <div
                class={`p-2 rounded-md ${
                    index % 2 ? "bg-gray-50" : "bg-white"
                } text-gray-700`}
            >
                {ingredient.ingredient.IngredientName}
            </div>
            <div
                class={`p-2 rounded-md ${
                    index % 2 ? "bg-gray-50" : "bg-white"
                } text-gray-700`}
            >
                {ingredient.quantity}
                {ingredient.measurement}
            </div>
        {/each}
    </div>
</div>
