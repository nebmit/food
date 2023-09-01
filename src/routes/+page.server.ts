import { DatabaseService } from "$lib/databaseService";
import type { Recipe } from "$lib/types";

export async function load() {
    try {
        const allRecipes: Recipe[] = await DatabaseService.getRecipes();
        const randomRecipes = allRecipes.sort(() => Math.random() - Math.random()).slice(0, 3);
        return {
            randomRecipes
        };
    } catch (error) {
        console.error("Error in load function:", error);
        return {
            status: 500,
            error: "Internal server error",
        };
    }
}