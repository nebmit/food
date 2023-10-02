<script lang="ts">
    import Navbar from "$lib/fragments/navbar.svelte";
    import type {
        Instruction,
        RecipeIngredient,
        RecipeItem,
        RecipeVersion,
    } from "$lib/types";
    import DeleteButton from "./deleteButton.svelte";

    export let data: { recipeVersion: RecipeVersion };
    const originalRecipeVersion: RecipeVersion = JSON.parse(
        JSON.stringify(data.recipeVersion)
    );
    const recipeVersion = data.recipeVersion;

    async function sendRequest(url: string, formData: FormData) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                console.error("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function removeIngredient(ingredient: RecipeIngredient) {
        const formData = new FormData();
        formData.append(
            "recipeVersionIngredientID",
            ingredient.RecipeVersionIngredientID.toString()
        );

        await sendRequest("?/removeIngredient", formData);

        location.reload();
    }

    async function removeItem(item: RecipeItem) {
        const formData = new FormData();
        formData.append(
            "recipeVersionItemID",
            item.RecipeVersionItemID.toString()
        );

        await sendRequest("?/removeItem", formData);

        location.reload();
    }

    async function removeInstruction(instruction: Instruction) {
        const formData = new FormData();
        formData.append("instructionID", instruction.InstructionID.toString());

        await sendRequest("?/removeInstruction", formData);

        location.reload();
    }

    async function saveRecipe() {
        const formData = new FormData();
        formData.append(
            "recipeVersionID",
            recipeVersion.RecipeVersionID.toString()
        );
        formData.append(
            "activeTimeMinutes",
            recipeVersion.ActiveTimeMinutes.toString()
        );
        formData.append(
            "passiveTimeMinutes",
            recipeVersion.PassiveTimeMinutes.toString()
        );
        formData.append(
            "complexityRating",
            (recipeVersion.ComplexityRating ?? 0).toString()
        );
        formData.append(
            "mayhemRating",
            (recipeVersion.MayhemRating ?? 0).toString()
        );
        formData.append(
            "portionQuantity",
            recipeVersion.PortionQuantity.toString()
        );
        formData.append(
            "portionDescriptor",
            recipeVersion.PortionDescriptor.toString()
        );
        formData.append("versionComment", recipeVersion.VersionComment ?? "");
        await sendRequest("?/saveVersion", formData);

        const instructionsPromises = recipeVersion.Instructions.map(
            async (instruction) => {
                if (
                    originalRecipeVersion.Instructions.find(
                        (originalInstruction) =>
                            originalInstruction.InstructionID ===
                            instruction.InstructionID
                    )?.StepDetail === instruction.StepDetail
                ) {
                    return;
                }
                const formData = new FormData();
                formData.append(
                    "instructionID",
                    instruction.InstructionID.toString()
                );
                formData.append("stepDetail", instruction.StepDetail);
                await sendRequest("?/saveInstruction", formData);
            }
        );

        const ingredientsPromises = recipeVersion.Ingredients.map(
            async (ingredient) => {
                if (
                    originalRecipeVersion.Ingredients.find(
                        (originalIngredient) =>
                            originalIngredient.RecipeVersionIngredientID ===
                            ingredient.RecipeVersionIngredientID
                    )?.Quantity === ingredient.Quantity
                ) {
                    return;
                }
                const formData = new FormData();
                formData.append(
                    "recipeVersionIngredientID",
                    ingredient.RecipeVersionIngredientID.toString()
                );
                formData.append("measurement", ingredient.Measurement ?? "");
                formData.append("quantity", ingredient.Quantity.toString());
                await sendRequest("?/saveIngredient", formData);
            }
        );

        const itemsPromises = recipeVersion.Items.map(async (item) => {
            if (
                originalRecipeVersion.Items.find(
                    (originalItem) =>
                        originalItem.RecipeVersionItemID ===
                        item.RecipeVersionItemID
                )?.Quantity === item.Quantity
            ) {
                return;
            }
            const formData = new FormData();
            formData.append(
                "recipeVersionItemID",
                item.RecipeVersionItemID.toString()
            );
            formData.append("quantity", item.Quantity.toString());
            await sendRequest("?/saveItem", formData);
        });

        await Promise.all([
            ...instructionsPromises,
            ...ingredientsPromises,
            ...itemsPromises,
        ]);

        location.reload();
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
            <div class="flex items-center">
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
            <label class="mr-2" for="activeDuration">Active:</label>
            <input
                bind:value={recipeVersion.ActiveTimeMinutes}
                class="w-14 mb-2 text-right"
                id="activeDuration"
                min="0"
                type="number"
            />
            <label class="mr-2" for="passiveDuration">Passive:</label>
            <input
                bind:value={recipeVersion.PassiveTimeMinutes}
                class="w-14 mb-2 text-right"
                id="passiveDuration"
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

        <div class="p-4">
            <!-- Ingredients Input -->
            <h2 class="text-xl font-semibold mb-2">Ingredients</h2>
            <div
                class="grid grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr),auto] gap-2 p-2"
            >
                {#each recipeVersion.Ingredients as ingredient (ingredient)}
                    <input
                        bind:value={ingredient.Ingredient.IngredientName}
                        placeholder="Ingredient"
                        type="text"
                        disabled
                    />
                    <input
                        bind:value={ingredient.Quantity}
                        class="text-right"
                        placeholder="Quantity"
                        type="number"
                    />
                    <input
                        bind:value={ingredient.Measurement}
                        placeholder="Measurement"
                        type="text"
                    />
                    <DeleteButton
                        onDelete={() => removeIngredient(ingredient)}
                    />
                {/each}
            </div>

            <!-- Items Input -->
            <h2 class="text-xl font-semibold mb-2 mt-8">Items</h2>
            <div
                class="grid grid-cols-[minmax(0,2fr),minmax(0,2fr),auto] gap-2 p-2"
            >
                {#each recipeVersion.Items as item (item)}
                    <input
                        bind:value={item.Item.ItemName}
                        placeholder="Item"
                        type="text"
                        disabled
                    />
                    <input
                        bind:value={item.Quantity}
                        class="text-right"
                        placeholder="Quantity"
                        type="number"
                        min="1"
                    />
                    <DeleteButton onDelete={() => removeItem(item)} />
                {/each}
            </div>
        </div>

        <!-- Instructions Input -->
        <div class="p-4 col-span-1">
            <h2 class="text-xl font-semibold mb-2">Method</h2>
            <div class="grid grid-cols-1 gap-2">
                {#each recipeVersion.Instructions as instruction}
                    <div class="flex items-center gap-x-2">
                        <span class="flex-grow font-semibold"
                            >Step {instruction.StepNumber}</span
                        >
                        <DeleteButton
                            onDelete={() => removeInstruction(instruction)}
                        />
                    </div>
                    <textarea
                        bind:value={instruction.StepDetail}
                        placeholder="Instruction"
                    />
                {/each}
            </div>
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

    input:disabled {
        background-color: #f7fafc;
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
</style>
