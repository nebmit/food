<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import type { RecipeVersion } from "$lib/types";

    export let data: { recipeVersion: RecipeVersion };
    const recipeVersion = data.recipeVersion;

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
            #{recipeVersion.RecipeVersionID}
            <div class="hidden md:flex items-center">
                Parent:&nbsp;
                {#if recipeVersion.ParentVersionID}
                    <a
                        href="/version/{recipeVersion.ParentVersionID}"
                        class="text-blue-400 hover:text-blue-600 transition duration-700 ease-in-out mr-4"
                        >#{recipeVersion.ParentVersionID}
                    </a>
                {:else}
                    <span class="text-gray-400">None</span>
                {/if}
            </div>
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Recipe Details Input -->
        <div class="grid grid-cols-4 p-4">
            <label class="mr-2" for="passiveDuration">Passive:</label>
            <input
                bind:value={recipeVersion.PassiveTimeMinutes}
                class="w-14 mb-2 text-right"
                id="passiveDuration"
                min="0"
                type="number"
            />
            <label class="mr-2" for="activeDuration">Active:</label>
            <input
                bind:value={recipeVersion.ActiveTimeMinutes}
                class="w-14 mb-2 text-right"
                id="activeDuration"
                min="0"
                type="number"
            />
            <label class="mr-2" for="complexity">Complexity:</label>
            <input
                bind:value={recipeVersion.ComplexityRating}
                class="w-14 mb-2 text-right"
                id="complexity"
                max="5"
                min="1"
                type="number"
            />
            <label class="mr-2" for="mayhem">Mayhem:</label>
            <input
                bind:value={recipeVersion.MayhemRating}
                class="w-14 mb-2 text-right"
                id="mayhem"
                max="5"
                min="1"
                type="number"
            />
            <label class="mr-2" for="portionQuantity">Quantity:</label>
            <div class="col-span-3">
                <input
                    bind:value={recipeVersion.PortionQuantity}
                    class="w-14 text-right"
                    id="portionQuantity"
                    type="number"
                />
                <input
                    bind:value={recipeVersion.PortionDescriptor}
                    class="w-20 text-left"
                    type="text"
                />
            </div>
        </div>

        <div class="p-4 order-5 sm:-order-none">
            <div class="mb-2 font-semibold">
                <label for="comment">Version Comment:</label>
            </div>
            <textarea
                class="w-full h-full resize-none"
                id="comment"
                bind:value={recipeVersion.VersionComment}
            />
        </div>

        <div class="p-4 col-span-1">
            <!-- Ingredients Input -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-4 gap-2">
                {#each recipeVersion.Ingredients as ingredient (ingredient)}
                    <input
                        bind:value={ingredient.Ingredient.IngredientName}
                        class="col-span-2"
                        placeholder="Ingredient"
                        type="text"
                    />
                    <input
                        bind:value={ingredient.Quantity}
                        class="col-span-1 text-right"
                        placeholder="Quantity"
                        type="number"
                    />
                    <input
                        bind:value={ingredient.Measurement}
                        class="col-span-1"
                        placeholder="Measurement"
                        type="text"
                    />
                {/each}
            </div>
            <button on:click={addIngredient} class="subtle-button"
                >Add Ingredient</button
            >

            <!-- Items Input -->
            <h2 class="text-xl font-semibold mb-2 mt-8">Items</h2>
            <div class="grid grid-cols-2 gap-2">
                {#each recipeVersion.Items as item (item)}
                    <input
                        bind:value={item.Item.ItemName}
                        placeholder="Item"
                        type="text"
                    />
                    <input
                        bind:value={item.Quantity}
                        class="text-right"
                        placeholder="Quantity"
                        type="number"
                    />
                {/each}
            </div>
            <button on:click={addItem} class="subtle-button">Add Item</button>
        </div>

        <!-- Instructions Input -->
        <div class="p-4 col-span-1">
            <h2 class="text-xl font-semibold mb-2">Method</h2>
            <div class="grid grid-cols-1 gap-2">
                {#each recipeVersion.Instructions as instruction}
                    <span class="font-semibold"
                        >Step {instruction.StepNumber}</span
                    >
                    <textarea
                        bind:value={instruction.StepDetail}
                        placeholder="Instruction"
                    />
                {/each}
            </div>
            <button on:click={addInstruction} class="subtle-button"
                >Add Step</button
            >
        </div>
    </div>

    <div class="text-right mt-6">
        <button
            on:click={saveRecipe}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-400 ease-in-out"
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

    input {
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-family: "Montserrat";
        font-size: 0.875rem;
        line-height: 1.25rem;
        padding: 0.5rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.05rem;
        align-self: center;
    }

    textarea {
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-family: "Montserrat";
        font-size: 0.875rem;
        line-height: 1.25rem;
        padding: 0.5rem;
        resize: none;
    }

    .subtle-button {
        margin-top: 1rem;
        background-color: #4a5568;
        border-radius: 0.25rem;
        color: #ffffff;
        font-family: "Montserrat";
        font-size: 0.875rem;
        font-weight: 600;
        letter-spacing: 0.1rem;
        line-height: 1.25rem;
        padding: 0.5rem 1rem;
        text-transform: uppercase;
    }

    .subtle-button:hover {
        background-color: #718096;
        transition: background-color 0.2s ease-in-out;
    }
</style>
