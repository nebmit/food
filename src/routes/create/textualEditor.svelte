<script lang="ts">
    export let onDiscard: () => void;
    export let onSave: (recipeVersionText: string) => Promise<string | void>;
    export let recipeName: string;

    const template = `[PortionQuantity | integer] ;; [PortionDescriptor | string] ;; [ActiveTimeMinutes | integer] ;; [PassiveTimeMinutes | integer] ;; [ComplexityRating | integer (1-5)] ;; [MayhemRating | integer (1-5)] ;;
INGREDIENTS
[IngredientName | string] :: [Quantity | number] :: [Measurement | string] ;;
[IngredientName | string] :: [Quantity | number] :: [Measurement | string] ;; ...
ITEMS
[ItemName | string] :: [Quantity | number] ;;
[ItemName | string] :: [Quantity | number] ;; ...
INSTRUCTIONS
[StepNumber | integer] :: [StepDetail | string] ;;
[StepNumber | integer] :: [StepDetail | string] ;; ...`;

    const llmRecipePrompt = `Generate a Recipe for "${recipeName}" using metric measurements in the following format, replacing variables in square brackets with the actual value. Please create straightforward and simple instructions, leave out optional or alternative items and ingredients. The instructions use the following notation to embed ingredients {PercentageAmount:IngredientName}. Strictly follow the format to enable computer parsing.\n
Example for Chocolate Chip Cookies:
24 ;; cookies ;; 15 ;; 10 ;; 2 ;; 1 ;;
INGREDIENTS
Butter :: 225 :: grams ;;
Granulated sugar :: 200 :: grams ;;
Brown sugar :: 150 :: grams ;;
Eggs :: 2 :: whole ;;
Vanilla extract :: 5 :: milliliters ;;
All-purpose flour :: 375 :: grams ;;
Baking soda :: 5 :: grams ;;
Salt :: 5 :: grams ;;
Chocolate chips :: 200 :: grams ;;
ITEMS
Baking sheet :: 2 ;;
Mixing bowl :: 2 ;;
Spoon :: 1 ;;
Oven :: 1 ;;
INSTRUCTIONS
1 :: Preheat the oven to 190°C. ;;
2 :: In a mixing bowl, mix the {1:butter}, {1:granulated sugar}, and {1:brown sugar} until smooth. ;;
3 :: Beat in {1:eggs}, then stir in {1:vanilla extract}. ;;
4 :: In a separate bowl, whisk together the . ;;
5 :: Gradually add {1:flour}, {1:baking soda}, and {1:salt} to the butter mixture and mix until combined. ;;
6 :: Fold in {1:chocolate chips}. ;;
7 :: Using the spoon or cookie scoop, drop rounded tablespoonfuls onto the baking sheets. ;;
8 :: Bake in the preheated oven for 8-10 minutes or until the edges are lightly browned. ;;
9 :: Remove from the oven and let the cookies cool for a few minutes before transferring to a wire rack to cool completely. ;;\n\nFormat:\n${template}`;

    let recipeVersionText = "";
    let saveFeedback = "";

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
    <div>
        <span class="text-sm text-red-500">
            {saveFeedback}
        </span>
    </div>
    <button
        class="py-2 px-6 bg-white border border-gray-300 hover:border-sky-500 focus:outline-none rounded transition duration-200"
        on:click={async () => {
            saveFeedback = (await onSave(recipeVersionText)) ?? "";
        }}
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
