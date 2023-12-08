<script lang="ts">
    import { deserialize } from "$app/forms";
    import { stars } from "$lib/actions";
    import { setToCart } from "$lib/cart";
    import Navbar from "$lib/fragments/navbar.svelte";
    import { parseInstructionScaled } from "$lib/parser";
    import { pageTitle } from "$lib/stores";
    import type {
        Instruction,
        Recipe,
        RecipeIngredient,
        RecipeItem,
    } from "$lib/types";
    import { onDestroy } from "svelte";
    import Modal from "./modal.svelte";

    export let data: { recipe: Recipe };
    const recipe = data.recipe;
    const recipeVersion = recipe.MainVersion;

    const ingredients: RecipeIngredient[] = recipeVersion.Ingredients;
    const instructions: Instruction[] = recipeVersion.Instructions;
    const items: RecipeItem[] = recipeVersion.Items;

    const imageUrl = "/images/recipes/" + recipe.RecipeID;

    pageTitle.set(recipe.RecipeName);
    onDestroy(() => pageTitle.set(null));

    let showEditModal = false;

    let selectedPortion = recipeVersion.PortionQuantity;
    $: scalingFactor = selectedPortion / recipeVersion.PortionQuantity;

    async function onSave(image: File, name: string): Promise<string | void> {
        name = name.trim();

        if (image && (image.type !== "image/png" || image.size > 10000000)) {
            return "Please provide a valid image file less than 10MB in size";
        }
        if (
            name &&
            (name.length > 50 || name.length < 3 || name.match(/[^a-zA-Z0-9 ]/))
        ) {
            return "Please provide a valid name between 3 and 50 characters";
        }

        const formData = new FormData();
        if (image) formData.append("image", image);
        if (name) formData.append("name", name);

        if ([...formData.entries()].length === 0) {
            showEditModal = false;
            return;
        }

        formData.append("recipeID", recipe.RecipeID.toString());

        try {
            const response = await fetch("?/modifyRecipe", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.text();

            const result = deserialize(data);
            if (result.type === "success") {
                location.reload();
                showEditModal = false;
            } else {
                console.error("There was a problem with the server:", result);
                return "Something went wrong. Please try again.";
            }
        } catch (e: unknown) {
            console.error("There was a problem with the fetch operation:", e);
            return e instanceof Error ? e.message : "Something went wrong.";
        }
    }
</script>

{#if showEditModal}
    <Modal
        {imageUrl}
        recipeName={recipe.RecipeName}
        {onSave}
        onCancel={() => (showEditModal = false)}
    />
{/if}

<div class="hidden sm:inline">
    <Navbar />
</div>

<div class="max-w-screen-lg mx-auto p-4 lg:mt-10">
    <div class="relative h-40 mb-6">
        <img
            class="absolute top-0 left-0 w-full h-full rounded-t-lg object-cover object-center blur-sm"
            src={imageUrl}
            alt={recipe.RecipeName}
        /><button
            class="absolute top-2 right-2 bg-slate-400 bg-opacity-40 hover:bg-opacity-60 text-white font-bold py-2 px-4 rounded"
            on:click={() => {
                setToCart(recipe, selectedPortion);
            }}
        >
            Add to Shopping List
        </button>
        <div
            class="relative text-center top-1/3 p-2 px-4 text-white text-3xl font-bold text-shadow"
        >
            {recipe.RecipeName}
        </div>
    </div>

    <!-- Additional Information -->
    <div class="hidden md:inline">
        <hr />
        <div
            class="my-4 px-4 text-lg flex flex-wrap justify-between items-center"
        >
            <div class="flex flex-wrap items-center space-x-2">
                <div class="flex items-center">
                    <input
                        bind:value={selectedPortion}
                        type="number"
                        class="w-16 text-center border border-gray-300 rounded px-2 py-1 mr-2"
                        min="1"
                    />
                    {recipeVersion.PortionDescriptor}
                </div>
                <span>|</span>
                <div class="flex items-center">
                    ~ {recipeVersion.ActiveTimeMinutes +
                        recipeVersion.PassiveTimeMinutes} Minutes
                </div>
                <span>|</span>
                {#if recipeVersion.ComplexityRating}
                    <div class="text-cyan-500">
                        Complexity
                        <span
                            use:stars={{
                                total: 5,
                                filled: recipeVersion.ComplexityRating,
                            }}
                        />
                    </div>
                    <span>|</span>
                {/if}
                {#if recipeVersion.MayhemRating}
                    <div class="text-purple-500">
                        Mayhem
                        <span
                            use:stars={{
                                total: 5,
                                filled: recipeVersion.MayhemRating,
                            }}
                        />
                    </div>
                {/if}
            </div>

            <!-- Recipe Version -->
            <div class="hidden lg:flex items-center">
                <a
                    href="/version/{recipeVersion.RecipeVersionID}"
                    class="text-blue-400 hover:text-blue-600 transition duration-700 ease-in-out mr-4"
                    >#{recipeVersion.RecipeVersionID}
                </a>
                <button
                    class="bg-blue-700 text-white hover:bg-blue-800 rounded px-4 py-1 font-semibold transition duration-200 ease-in-out"
                    on:click={() => (showEditModal = true)}>Edit</button
                >
            </div>
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 col-span-1">
            <div class="md:hidden mb-4">
                <input
                    bind:value={selectedPortion}
                    type="number"
                    class="w-16 text-center border border-gray-300 rounded px-2 py-1 mr-2"
                    min="1"
                />
                {recipeVersion.PortionDescriptor}
            </div>

            <!-- Ingredients List -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each ingredients as ingredient}
                    <div class="col-span-1">
                        {ingredient.Ingredient.IngredientName}
                    </div>
                    <div class="col-span-1">
                        {ingredient.Quantity * scalingFactor}
                        {ingredient.Measurement ? ingredient.Measurement : ""}
                    </div>
                {/each}
            </div>

            <!-- Items List -->
            <h2 class="text-xl font-semibold mb-2 mt-8">Items</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each items as item}
                    <div class="col-span-1">
                        {item.Item.ItemName}
                    </div>
                    <div class="col-span-1">
                        {item.Quantity}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Instructions -->
        <div class="p-4 col-span-2">
            <h2 class="text-xl font-semibold mb-2">Method</h2>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
                {#each instructions as instruction}
                    <div class="col-span-2">
                        <span class="text-sm">Step</span>
                        <span class="font-semibold"
                            >{instruction.StepNumber}</span
                        >
                    </div>
                    <div class="col-span-10">
                        {parseInstructionScaled(
                            instruction.StepDetail,
                            ingredients,
                            scalingFactor,
                        )}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .text-shadow {
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.75);
    }

    h2 {
        font-family: "Montserrat";
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 600;
        letter-spacing: 0.1rem;
    }

    hr {
        border: 1px solid #ccc;
    }
</style>
