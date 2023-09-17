<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import type {
        Instruction,
        RecipeIngredient,
        RecipeItem,
        RecipeVersion,
    } from "$lib/types";

    export let data: { recipeVersion: RecipeVersion };
    const recipeVersion = data.recipeVersion;

    const ingredients: RecipeIngredient[] = recipeVersion.Ingredients;
    const instructions: Instruction[] = recipeVersion.Instructions;
    const items: RecipeItem[] = recipeVersion.Items;

    function addIngredient() {
        recipeVersion.Ingredients.push();
    }

    function addInstruction() {
        recipeVersion.Instructions.push();
    }

    function addItem() {
        recipeVersion.Items.push();
    }

    function saveRecipe() {
        // Logic to save the recipe to your backend
    }
</script>

<div class="hidden sm:inline">
    <Navbar />
</div>

<div class="max-w-screen-lg mx-auto p-4 lg:mt-10">
    <div class="relative mb-6">
        <div
            class="my-4 px-4 text-lg flex flex-wrap justify-between items-center"
        >
            #{recipeVersion.RecipeVersionID} | Parent: {recipeVersion.ParentVersionID ??
                "None"}
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 col-span-1">
            <!-- Ingredients Input -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-3 gap-2">
                {#each recipeVersion.Ingredients as ingredient (ingredient)}
                    <input
                        class="col-span-1"
                        type="text"
                        bind:value={ingredient.Ingredient.IngredientName}
                        placeholder="Ingredient"
                    />
                    <input
                        class="col-span-1"
                        type="number"
                        bind:value={ingredient.Quantity}
                        placeholder="Quantity"
                    />
                    <input
                        class="col-span-1"
                        type="text"
                        bind:value={ingredient.Measurement}
                        placeholder="Measurement"
                    />
                {/each}
            </div>
            <button on:click={addIngredient} class="mt-2">Add Ingredient</button
            >

            <!-- Items Input -->
            <h2 class="text-xl font-semibold mb-2 mt-8">Items</h2>
            <div class="grid grid-cols-2 gap-2">
                {#each recipeVersion.Items as item (item)}
                    <input
                        class="col-span-1"
                        type="text"
                        bind:value={item.Item.ItemName}
                        placeholder="Item"
                    />
                    <input
                        class="col-span-1"
                        type="number"
                        bind:value={item.Quantity}
                        placeholder="Quantity"
                    />
                {/each}
            </div>
            <button on:click={addItem} class="mt-2">Add Item</button>
        </div>

        <!-- Instructions Input -->
        <div class="p-4 col-span-2">
            <h2 class="text-xl font-semibold mb-2">Method</h2>
            <div class="grid grid-cols-2 gap-2">
                {#each recipeVersion.Instructions as instruction}
                    <span class="col-span-1">Step {instruction.StepNumber}</span
                    >
                    <textarea
                        class="col-span-1"
                        bind:value={instruction.StepDetail}
                        placeholder="Instruction"
                    />
                {/each}
            </div>
            <button on:click={addInstruction} class="mt-2">Add Step</button>
        </div>
    </div>

    <div class="text-right mt-6">
        <button
            on:click={saveRecipe}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Save Version
        </button>
    </div>
</div>

<style>
    h2 {
        font-family: "Montserrat";
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 600;
        letter-spacing: 0.1rem;
    }
</style>
