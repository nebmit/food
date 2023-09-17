<script lang="ts">
    import { writable } from "svelte/store";

    export let initialText: string = "";
    export let recipeIngredients: RecipeIngredient[] = [];
    let currentText = writable(initialText);
    let matches: string[] = [];
    let showAutocomplete = false;
    let currentIndex = -1;

    let startIdx = -1;

    // To keep track of the input text
    $currentText = initialText;

    const getMatches = (query: string) => {
        return recipeIngredients
            .filter((ri) =>
                ri.Ingredient.IngredientName.toLowerCase().includes(
                    query.toLowerCase()
                )
            )
            .map((ri) => ri.Ingredient.IngredientName);
    };

    const onInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = target.value;
        const lastIndex = value.lastIndexOf("{");
        const closeIndex = value.lastIndexOf("}");

        if (lastIndex > closeIndex) {
            startIdx = lastIndex;
            const partial = value.substring(lastIndex + 1);
            matches = getMatches(partial);
            showAutocomplete = matches.length > 0;
            currentIndex = -1;
        } else {
            startIdx = -1;
            showAutocomplete = false;
        }

        onChange($currentText);
    };

    const selectMatch = (match: string) => {
        const before = $currentText.substring(0, startIdx);
        const after = $currentText.substring(startIdx).replace(/[^}]*}/, "");
        $currentText = `${before}${match}${after}`;
        showAutocomplete = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (showAutocomplete) {
            if (e.key === "ArrowDown") {
                currentIndex = (currentIndex + 1) % matches.length;
                e.preventDefault();
            } else if (e.key === "ArrowUp") {
                currentIndex =
                    (currentIndex - 1 + matches.length) % matches.length;
                e.preventDefault();
            } else if (e.key === "Enter") {
                if (currentIndex !== -1) {
                    selectMatch(matches[currentIndex]);
                }
                e.preventDefault();
            }
        }
    };

    export let onChange: (text: string) => void = () => {};

    // Typings
    interface Ingredient {
        IngredientID: number;
        IngredientName: string;
        IsRecipe: boolean;
        RecipeID?: number;
        Tags: Tag[];
    }

    interface RecipeIngredient {
        RecipeVersionIngredientID: number;
        RecipeVersionID: number;
        Ingredient: Ingredient;
        Quantity: number;
        Measurement?: string;
    }

    interface Tag {
        // Assuming the structure, fill this up.
    }
</script>

<div>
    <input
        bind:value={$currentText}
        on:input={onInput}
        on:keydown={onKeyDown}
    />
    {#if showAutocomplete}
        <ul>
            {#each matches as match, index}
                <li
                    on:click={() => selectMatch(match)}
                    class={currentIndex === index ? "highlighted" : ""}
                >
                    {match}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .highlighted {
        background-color: yellow;
    }
</style>
