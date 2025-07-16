<script lang="ts">
    import { stars } from "$lib/actions";
    import type { Recipe } from "$lib/types";

    export let recipe: Recipe;

    $: recipeVersion = recipe.MainVersion;
    $: encodedRecipeName = encodeURIComponent(recipe.RecipeName);
    $: imageUrl = "/images/recipes/" + encodedRecipeName + ".webp";
    $: complexity = recipeVersion.ComplexityRating ?? 0;
    $: mayhem = recipeVersion.MayhemRating ?? 0;
</script>

<a href={"/recipe/" + encodedRecipeName} class="block group">
    <article
        class="w-72 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer select-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
    >
        <div class="relative h-48 overflow-hidden">
            <img
                class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
                src={imageUrl}
                alt={recipe.RecipeName}
                loading="lazy"
            />
            <div
                class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            <div
                class="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-medium shadow-sm"
            >
                {recipeVersion.ActiveTimeMinutes +
                    recipeVersion.PassiveTimeMinutes} min
            </div>
        </div>

        <div class="p-5 space-y-4">
            <h3
                class="text-xl font-bold text-gray-900 h-14 overflow-hidden line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors duration-200"
            >
                {recipe.RecipeName}
            </h3>

            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="flex flex-col items-center">
                        <span
                            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
                        >
                            Complexity
                        </span>
                        <div class="flex items-center">
                            <span
                                class="text-emerald-600 font-semibold"
                                use:stars={{ total: 5, filled: complexity }}
                            ></span>
                        </div>
                    </div>

                    <div class="w-px h-8 bg-gray-200"></div>

                    <div class="flex flex-col items-center">
                        <span
                            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
                        >
                            Mayhem
                        </span>
                        <div class="flex items-center">
                            <span
                                class="text-orange-500 font-semibold"
                                use:stars={{ total: 5, filled: mayhem }}
                            ></span>
                        </div>
                    </div>
                </div>

                <div
                    class="text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                        ></path>
                    </svg>
                </div>
            </div>
        </div>
    </article>
</a>
