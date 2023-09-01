import { DatabaseService } from "$lib/databaseService";

export async function load() {
    console.log("Load function called"); // Add this line
    try {
        const recipe = await DatabaseService.getRecipeById(1);
        console.log("Recipe loaded", recipe);
        return {
            recipe
        };
    } catch (error) {
        console.error("Error in load function:", error);
        return {
            status: 500,
            error: "Internal server error",
        };
    }
}