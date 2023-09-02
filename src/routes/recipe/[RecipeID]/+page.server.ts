import { DatabaseService } from "$lib/server/databaseService";
import type { Recipe } from "$lib/types";
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const RecipeID = parseInt(params.RecipeID);
        const recipe: Recipe = await DatabaseService.getRecipeById(RecipeID);
        return {
            recipe
        };
    } catch (e) {
        throw error(404, 'Not found');
    }
}