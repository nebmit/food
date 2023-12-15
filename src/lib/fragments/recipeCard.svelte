<script lang="ts">
    import { stars } from "$lib/actions";
    import type { Recipe } from "$lib/types";

    export let recipe: Recipe;

    let recipeVersion = recipe.MainVersion;

    const imageUrl = "/images/recipes/" + recipe.RecipeID + ".webp";
    const complexity = recipeVersion.ComplexityRating ?? 0;
    const mayhem = recipeVersion.MayhemRating ?? 0;
</script>

<a href={"/recipe/" + recipe.RecipeID}>
    <div
        class="w-64 bg-white rounded-lg shadow-md cursor-pointer select-none hover:shadow-xl hover:scale-105 transition ease-in-out duration-200 transform"
    >
        <div class="relative h-40">
            <img
                class="absolute top-0 left-0 w-full h-full rounded-t-lg object-cover object-center"
                src={imageUrl}
                alt={recipe.RecipeName}
            />
            <div
                class="absolute bottom-0 right-0 p-2 rounded-tl-lg bg-slate-700 bg-opacity-80 text-white text-xs font-bold"
            >
                ~ {recipeVersion.ActiveTimeMinutes +
                    recipeVersion.PassiveTimeMinutes} min
            </div>
        </div>
        <div class="p-4">
            <p
                class="text-lg font-semibold h-12 overflow-hidden line-clamp-2 overflow-ellipsis leading-tight"
            >
                {recipe.RecipeName}
            </p>
            <div class="flex flex-row space-x-2">
                <div class="text-cyan-500">
                    Complexity
                    <span
                        class="font-bold"
                        use:stars={{ total: 5, filled: complexity }}
                    />
                </div>
                <div class="text-purple-500">
                    Mayhem
                    <span
                        class="font-bold"
                        use:stars={{ total: 5, filled: mayhem }}
                    />
                </div>
            </div>
        </div>
    </div>
</a>
