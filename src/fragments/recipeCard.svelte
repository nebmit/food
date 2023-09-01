<script lang="ts">
    import type { Recipe } from "$lib/types";

    export let recipe: Recipe;

    const imageUrl = "https://via.placeholder.com/400";
    const complexity = recipe.ComplexityRating ?? 0;
    const mayhem = recipe.MayhemRating ?? 0;

    function openRecipeLink() {
        window.open("https://example.com/recipe", "_blank");
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            openRecipeLink();
        }
    }
</script>

<div
    class="w-64 bg-white rounded-lg shadow-md cursor-pointer select-none hover:shadow-xl hover:scale-105 transition ease-in-out duration-200 transform"
    on:click={openRecipeLink}
    on:keydown={handleKeydown}
    tabindex="0"
    role="button"
    aria-label="Open recipe"
>
    <div class="relative h-40">
        <img
            class="absolute top-0 left-0 w-full h-full rounded-t-lg object-cover object-center"
            src={imageUrl}
            alt={recipe.RecipeName}
        />
        <div
            class="absolute bottom-0 right-0 p-2 rounded-tl-lg bg-sky-900 bg-opacity-80 text-white text-xs font-bold"
        >
            ~ {recipe.EstimatedTime} min
        </div>
    </div>
    <div class="p-4">
        <h2 class="text-lg font-semibold">{recipe.RecipeName}</h2>
        <div class="flex space-x-2">
            <div class="text-yellow-500">
                Complexity
                {#each Array(5).fill(null) as _, i}
                    <span>{i < complexity ? "★" : "☆"}</span>
                {/each}
            </div>
            <div class="text-blue-500">
                Mayhem
                {#each Array(5).fill(null) as _, i}
                    <span>{i < mayhem ? "★" : "☆"}</span>
                {/each}
            </div>
        </div>
    </div>
</div>
