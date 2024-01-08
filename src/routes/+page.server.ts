import { DatabaseService } from "$lib/server/databaseService";
import type { Recipe } from "$lib/types";

export async function load() {
    try {
        const randomRecipes: Recipe[] = await DatabaseService.getRandomRecipes(3);
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