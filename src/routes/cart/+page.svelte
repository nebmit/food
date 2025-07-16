<script lang="ts">
    import { deserialize } from "$app/forms";
    import { getCart, getCartIngredients, setToCart } from "$lib/cart";
    import type { CartIngredient, Recipe } from "$lib/types";
    import { onMount } from "svelte";
    import { QRCodeImage } from "svelte-qrcode-image";

    let list_url: string | null = null;

    let cartItems: { recipe: Recipe; quantity: number }[] = [];
    let cartIngredients: CartIngredient[] = [];

    onMount(async () => {
        loadCart();
    });

    let timeout: number | null = null;
    async function loadCart() {
        cartItems = getCart();
        cartIngredients = getCartIngredients();

        if (cartItems.length === 0) {
            list_url = null;
            return;
        }

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(createList, 500) as unknown as number;
    }

    async function createList() {
        const formData = new FormData();
        formData.append("ingredients", JSON.stringify(cartIngredients));
        try {
            const response = await fetch("?/createCart", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.text();

            const result = deserialize(data);
            if (result.type === "success" && result.data) {
                list_url = (result.data.url as string) || null;
            } else {
                console.error("There was a problem with the server:", result);
            }
        } catch (e: unknown) {
            console.error("There was a problem with the fetch operation:", e);
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

<div class="bg-white flex-1">
    <div class="max-w-6xl mx-auto px-8 py-12">
        <!-- Page Header -->
        <div class="mb-12">
            <h1 class="text-3xl font-bold text-gray-800 tracking-tight mb-2">
                pantry
            </h1>
            <p class="text-gray-600">your saved recipes and shopping list</p>
        </div>

        {#if cartItems.length === 0}
            <!-- Empty State -->
            <div class="text-center py-16">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                </div>
                <h2 class="text-xl font-medium text-gray-800 mb-2">
                    your pantry is empty
                </h2>
                <p class="text-gray-600 mb-6">
                    add some recipes to get started
                </p>
                <a
                    href="/"
                    class="inline-flex items-center px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
                >
                    browse recipes
                </a>
            </div>
        {:else}
            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <!-- Recipes Section -->
                <div class="lg:col-span-2">
                    <div class="mb-8">
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight mb-6"
                        >
                            recipes ({cartItems.length})
                        </h2>
                        <div class="space-y-2">
                            {#each cartItems as item}
                                <div
                                    class="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors duration-200"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <label
                                                    class="text-xs font-medium text-gray-500"
                                                    for={"qty-" +
                                                        item.recipe.RecipeID}
                                                    >qty</label
                                                >
                                                <input
                                                    id={"qty-" +
                                                        item.recipe.RecipeID}
                                                    type="number"
                                                    min="1"
                                                    bind:value={item.quantity}
                                                    on:change={() =>
                                                        updateRecipe(
                                                            item.recipe,
                                                            item.quantity,
                                                        )}
                                                    class="w-14 h-7 px-2 text-sm text-gray-700 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400 transition-colors duration-200"
                                                />
                                            </div>
                                            <div>
                                                <h3
                                                    class="font-medium text-gray-800"
                                                >
                                                    {item.recipe.RecipeName}
                                                </h3>
                                            </div>
                                        </div>
                                        <button
                                            on:click={() =>
                                                handleRemove(item.recipe)}
                                            class="px-3 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            remove
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Ingredients Section -->
                    <div>
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight mb-6"
                        >
                            shopping list ({cartIngredients.length} items)
                        </h2>
                        <div
                            class="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100"
                        >
                            {#each cartIngredients as ingredient}
                                <div
                                    class="p-4 flex justify-between items-center"
                                >
                                    <span class="text-gray-800 font-medium">
                                        {ingredient.ingredient.IngredientName}
                                    </span>
                                    <span class="text-gray-600">
                                        {ingredient.quantity}
                                        {ingredient.measurement}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- QR Code Sidebar -->
                <div class="lg:col-span-1">
                    <div class="sticky top-24">
                        <h2
                            class="text-xl font-medium text-gray-800 tracking-tight mb-6"
                        >
                            quick access
                        </h2>
                        <div
                            class="bg-white border border-gray-200 rounded-lg p-6 text-center"
                        >
                            {#if list_url}
                                <div class="mb-4">
                                    <a
                                        href={list_url}
                                        target="_blank"
                                        class="block"
                                    >
                                        <div class="flex justify-center">
                                            <QRCodeImage
                                                bind:text={list_url}
                                                errorCorrectionLevel="M"
                                                displayType="canvas"
                                                width={200}
                                            />
                                        </div>
                                    </a>
                                </div>
                                <p class="text-sm text-gray-600 mb-4">
                                    scan to view your shopping list on mobile
                                </p>
                                <a
                                    href={list_url}
                                    target="_blank"
                                    class="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-md transition-colors duration-200"
                                >
                                    open list
                                </a>
                            {:else}
                                <div
                                    class="w-48 h-48 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-lg"
                                >
                                    <div class="text-gray-400">
                                        <svg
                                            class="w-12 h-12"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="1.5"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600">
                                    generating your shopping list...
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
