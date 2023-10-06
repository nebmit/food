<script lang="ts">
    import { getCart, getCartIngredients, setToCart } from "$lib/cart";
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
    }

    function handleRemove(recipe: Recipe) {
        setToCart(recipe, -1);
        loadCart();
    }
</script>

{#if list_url}
    <QRCodeImage
        bind:text={list_url}
        errorCorrectionLevel="M"
        displayType="canvas"
        width={300}
    />
{:else}
    <div style="width: 300px; height: 300px; padding: 25px;">
        <img src="/images/placeholder.png" alt="Preparing QR code" />
    </div>
{/if}

<h1><b>Your Cart</b></h1>
<h2>Recipes</h2>
<ul>
    {#each cartItems as item}
        <li>
            <input
                type="number"
                bind:value={item.quantity}
                on:change={() => setToCart(item.recipe, item.quantity)}
            />
            {item.recipe.RecipeName}
            <button on:click={() => handleRemove(item.recipe)}>Remove</button>
        </li>
    {/each}
</ul>

<h2>Ingredients</h2>
<div class="grid grid-cols-2">
    {#each cartIngredients as ingredient}
        <div>
            {ingredient.ingredient.IngredientName}
        </div>
        <div>
            {ingredient.quantity}
            {ingredient.measurement}
        </div>
    {/each}
</div>
