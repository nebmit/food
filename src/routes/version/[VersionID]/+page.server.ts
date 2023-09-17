import { DatabaseService } from "$lib/server/databaseService";
import type { RecipeVersion } from "$lib/types";
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const RecipeVersionID = parseInt(params.VersionID);
        const recipeVersion: RecipeVersion = await DatabaseService.getRecipeVersionById(RecipeVersionID);
        return {
            recipeVersion
        };
    } catch (e) {
        throw error(404, 'Not found');
    }
}