import { DatabaseService } from "$lib/server/databaseService";
import type { Recipe } from "$lib/types";
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const recipeId = parseInt(params.RecipeID, 10);
        const recipe: Recipe = await DatabaseService.getRecipeById(recipeId);
        return {
            recipe
        };
    } catch (e) {
        throw error(404, 'Recipe not found');
    }
}
