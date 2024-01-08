import { DatabaseService } from "$lib/server/databaseService";
import type { Recipe } from "$lib/types";
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const recipeName = decodeURIComponent(params.RecipeName);
        const recipe: Recipe = await DatabaseService.getRecipeByName(recipeName);
        return {
            recipe
        };
    } catch (e) {
        throw error(404, 'Recipe not found');
    }
}
