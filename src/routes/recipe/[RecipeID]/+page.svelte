<script lang="ts">
    import { deserialize } from "$app/forms";
    import Navbar from "$lib/fragments/navbar.svelte";
    import type {
        Instruction,
        Recipe,
        RecipeIngredient,
        RecipeItem,
    } from "$lib/types";
    import Modal from "./modal.svelte";

    export let data: { recipe: Recipe };
    const recipe = data.recipe;
    const recipeVersion = recipe.MainVersion;

    const ingredients: RecipeIngredient[] = recipeVersion.Ingredients;
    const instructions: Instruction[] = recipeVersion.Instructions;
    const items: RecipeItem[] = recipeVersion.Items;

    const imageUrl = "/images/recipes/" + recipe.RecipeID + ".png";

    let showEditModal = false;

    async function onSave(image: File, name: string): Promise<string | void> {
        console.log(image, name);

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
        } catch (error: any) {
            console.error(
                "There was a problem with the fetch operation:",
                error.message
            );
            return error.message;
        }
    }

    function parseInstruction(
        instruction: string,
        ingredients: RecipeIngredient[]
    ): string {
        return instruction.replace(
            /\{(?:(\d+(\.\d+)?):)?([\w\s]+)\}/g,
            (match, percentage, _, ingredientName) => {
                const ingredient = ingredients.find(
                    (ing) => ing.Ingredient.IngredientName === ingredientName
                );
                if (ingredient) {
                    if (percentage) {
                        const calculatedQuantity =
                            ingredient.Quantity * parseFloat(percentage);
                        return `${calculatedQuantity} ${
                            ingredient.Measurement || ""
                        } ${ingredientName}`; // If percentage, also return quantity and measurement.
                    }
                    return ingredientName; // If no percentage, just return the ingredient name.
                }
                return match; // If no ingredient found, return the match unchanged.
            }
        );
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
        />
        <div
            class="relative text-center top-1/3 p-2 px-4 text-white text-3xl font-bold text-shadow"
        >
            {recipe.RecipeName}
        </div>
    </div>

    <!-- Additional Information -->
    <div class="hidden sm:inline">
        <hr />
        <div
            class="my-4 px-4 text-lg flex flex-wrap justify-between items-center"
        >
            <div class="flex flex-wrap items-center space-x-2">
                <div class="flex items-center">
                    {recipeVersion.PortionQuantity}
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
                        {#each Array(5).fill(null) as _, i}
                            <span
                                >{i < recipeVersion.ComplexityRating
                                    ? "★"
                                    : "☆"}</span
                            >
                        {/each}
                    </div>
                    <span>|</span>
                {/if}
                {#if recipeVersion.MayhemRating}
                    <div class="text-purple-500">
                        Mayhem
                        {#each Array(5).fill(null) as _, i}
                            <span
                                >{i < recipeVersion.MayhemRating
                                    ? "★"
                                    : "☆"}</span
                            >
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Recipe Version -->
            <div class="hidden md:flex items-center">
                <a
                    href="/version/{recipeVersion.RecipeVersionID}"
                    class="text-blue-400 hover:text-blue-600 transition duration-700 ease-in-out mr-4"
                    >#{recipeVersion.RecipeVersionID}
                </a>
                <button
                    class="bg-blue-800 text-white hover:bg-blue-600 rounded px-4 py-1 font-semibold transition duration-200 ease-in-out"
                    on:click={() => (showEditModal = true)}>Edit</button
                >
            </div>
        </div>
        <hr />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 col-span-1">
            <!-- Ingredients List -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div class="grid grid-cols-2 gap-0">
                {#each ingredients as ingredient}
                    <div class="col-span-1">
                        {ingredient.Ingredient.IngredientName}
                    </div>
                    <div class="col-span-1">
                        {ingredient.Quantity}
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
                        {parseInstruction(instruction.StepDetail, ingredients)}
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
