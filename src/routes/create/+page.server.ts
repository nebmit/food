import { processAndInsertRecipeFromString } from "$lib/server/recipeService.js";
import { ParsingException } from "$lib/types.js";
import { fail } from '@sveltejs/kit';

export const actions = {
    createRecipe: async ({ request }) => {
        const data = await request.formData();

        const recipeName = data.get("recipeName") as string;
        const recipeVersionText = data.get("recipeVersionText") as string;

        if (!recipeName || !recipeVersionText) {
            return fail(400, { error: "Both recipe name and text are required." });
        }

        const invalidName = recipeName.length > 50 || recipeName.length < 3 || recipeName.match(/[^a-zA-Z0-9 ]/);
        if (invalidName) {
            return fail(400, { error: "Invalid recipe name format." });
        }

        try {
            const recipeId = await processAndInsertRecipeFromString(recipeName, recipeVersionText);

            return {
                redirect: `/recipe/${recipeId}`
            };
        } catch (e) {
            if (e instanceof ParsingException) {
                return fail(400, {
                    error: e.message
                });
            } else {
                throw e;
            }
        }
    }
};