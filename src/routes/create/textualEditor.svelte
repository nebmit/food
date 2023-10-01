<script lang="ts">
    export let onDiscard: () => void;
    export let onSave: (recipeVersionText: string) => void;
    export let recipeName: string;

    const template = `[PortionQuantity] ;; [PortionDescriptor] ;; [ActiveTimeMinutes] ;; [PassiveTimeMinutes] ;; [ComplexityRating] ;; [MayhemRating]
INGREDIENTS
[IngredientName] :: [Quantity] :: [Measurement] ;;
[IngredientName] :: [Quantity] :: [Measurement] ;; ...
ITEMS
[ItemName] :: [Quantity] ;;
[ItemName] :: [Quantity] ;; ...
INSTRUCTIONS
[StepNumber] :: [StepDetail] ;;
[StepNumber] :: [StepDetail] ;; ...`;

    const llmRecipePrompt = `Request: Generate a structured recipe for "${recipeName}" using the provided template. Ensure the content is direct and omits any optional or alternative items. Adherence to the format is essential for computer parsing.\n${template}`;

    let recipeVersionText = "";

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }
</script>

<h2 class="text-xl mb-6 pl-4 font-medium">{recipeName}</h2>

<div class="card mb-6 flex flex-col md:flex-row">
    <div class="flex-1 pr-4 pb-4 md:pb-0 md:border-r md:w-3/4">
        <p>
            The textual editor is purpose-built for adding new recipe versions
            through a structured text format. The provided template outlines the
            specific format required, ensuring clarity and consistency in recipe
            details. Additionally, for those utilizing a Language Learning Model
            (LLM), example prompts are available to assist in the recipe
            creation process.
        </p>
    </div>

    <div class="flex-1 pl-4 pt-4 md:pt-0 md:w-1/4">
        <div class="mb-2">
            <span class="block font-medium">Recipe Generation Prompt</span>
            <div class="flex justify-between items-center">
                <span class="truncate w-5/6">{llmRecipePrompt}</span>
                <button
                    class="copy-btn"
                    on:click={() => copyToClipboard(llmRecipePrompt)}
                    >Copy</button
                >
            </div>
        </div>

        <div>
            <span class="block font-medium">Template Structure Prompt</span>
            <div class="flex justify-between items-center">
                <span class="truncate w-5/6">{template}</span>
                <button
                    class="copy-btn"
                    on:click={() => copyToClipboard(template)}>Copy</button
                >
            </div>
        </div>
    </div>
</div>

<textarea
    class="w-full h-64 p-2 mb-4 card"
    placeholder={template}
    bind:value={recipeVersionText}
    rows="8"
/>

<div class="flex justify-end space-x-4 mb-10">
    <button
        class="py-2 px-6 bg-white border border-gray-300 hover:border-sky-500 focus:outline-none rounded transition duration-200"
        on:click={() => onSave(recipeVersionText)}
    >
        Save
    </button>
    <button
        class="py-2 px-6 bg-white border border-gray-300 hover:border-red-500 focus:outline-none rounded transition duration-200"
        on:click={() => {
            recipeVersionText = "";
            onDiscard();
        }}
    >
        Discard
    </button>
</div>

<style>
    .card {
        border: 1px solid #eaeaea;
        padding: 16px;
        border-radius: 6px;
        background-color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
            Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    }

    .copy-btn {
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .copy-btn:hover {
        background-color: #f0f0f0;
    }

    .copy-btn:active {
        background-color: #e0e0e0;
    }
</style>
